import {
  DEFAULT_LOCALE,
  PackAuction,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getProfileImageForUser,
} from '@/services/api/auth-service'
import { CollectibleService } from '@/services/collectible-service'
import ReleaseTemplate from '@/templates/release-template'
import { isAfterNow } from '@/utils/date-time'

interface ReleasePageProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  isHighestBidder: boolean | null
  isOutbid: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleasePage({
  avatars,
  disallowBuyOrClaim,
  isHighestBidder,
  isOutbid,
  isOwner,
  isWinningBidder,
  packAuction,
  packTemplate,
}: ReleasePageProps) {
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()

  useEffect(() => {
    Analytics.instance.viewItem({
      itemName: packTemplate.title,
      value: packAuction?.activeBid?.amount ?? packTemplate.price,
    })
  }, [packAuction, packTemplate])

  const handleClaimNFT = async (
    redeemCode: string
  ): Promise<{ packId: string } | string> => {
    // Redeem/claim asset
    const { packId } =
      packTemplate.type === PackType.Redeem
        ? await CollectibleService.instance.redeem(redeemCode)
        : await CollectibleService.instance.claim(packTemplate.templateId)

    // Don't mint if redemption fails
    if (!packId) {
      return t('forms:errors.invalidRedemptionCode')
    }

    // Clear redemption data
    if (packTemplate.type === PackType.Redeem) {
      setRedeemable(null)
    }

    return { packId }
  }

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Release', { name: packTemplate.title })}
      noPanel
    >
      <ReleaseTemplate
        avatars={avatars}
        disallowBuyOrClaim={disallowBuyOrClaim}
        handleClaimNFT={handleClaimNFT}
        isHighestBidder={isHighestBidder}
        isOutbid={isOutbid}
        isOwner={isOwner}
        isWinningBidder={isWinningBidder}
        packAuction={packAuction}
        packTemplate={packTemplate}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)

  const { packs: packTemplates } = await ApiClient.instance.getPublishedPacks({
    locale: context.locale || DEFAULT_LOCALE,
    slug: context?.params?.packSlug as string,
  })

  if (!packTemplates || packTemplates.length === 0) {
    return {
      notFound: true,
    }
  }

  const packTemplate = packTemplates[0]
  const avatars: { [key: string]: string | null } = {}
  let auction = null,
    isHighestBidder = null,
    isOwner = null,
    isWinningBidder = null,
    isOutbid = null,
    disallowBuyOrClaim = false

  if (packTemplate.type === PackType.Auction) {
    // Get auction data
    const auctionData = await ApiClient.instance.getAuctionPack(
      packTemplate.templateId
    )

    auction = auctionData
    const { activeBid, bids, ownerExternalId } = auctionData

    // Get bidder avatars
    await Promise.all(
      bids.map(async ({ externalId }) => {
        avatars[externalId] = await getProfileImageForUser(externalId)
      })
    )

    // Configure auction statuses
    if (user) {
      const isClosed = !!(
        packTemplate.auctionUntil &&
        !isAfterNow(new Date(packTemplate.auctionUntil))
      )
      const hasBids = bids?.some((b) => b.externalId === user.externalId)
      const isReserveMet = packTemplate.price <= activeBid?.amount
      isHighestBidder = activeBid?.externalId === user.externalId
      isOwner = user && ownerExternalId === user.externalId ? true : false
      isWinningBidder = isHighestBidder && isClosed && isReserveMet
      isOutbid = !isHighestBidder && hasBids && !isClosed
    }
  }

  // Check if pack allows user is allowed to buy or claim more than one
  if (
    user &&
    packTemplate.type !== PackType.Auction &&
    packTemplate.onePackPerCustomer
  ) {
    const { total } = await ApiClient.instance.getPacksByOwnerId(
      user.externalId,
      { templateIds: [packTemplate.templateId] }
    )
    if (total > 0) {
      disallowBuyOrClaim = true
    }
  }

  return {
    props: {
      avatars,
      disallowBuyOrClaim,
      isHighestBidder,
      isOutbid,
      isOwner,
      isWinningBidder,
      packAuction: auction,
      packTemplate,
    },
  }
}
