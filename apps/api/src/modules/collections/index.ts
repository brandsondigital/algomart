import { CollectionWithSetsSchema, SlugSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getAllCollections, getCollection } from './collections.routes'

export async function collectionsRoutes(app: FastifyInstance) {
  const tags = ['collections']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  // Services/Routes
  app
    .get(
      '/',
      {
        schema: {
          tags,
          security,
          response: {
            200: Type.Object({
              total: Type.Integer(),
              collections: Type.Array(CollectionWithSetsSchema),
            }),
          },
        },
      },
      getAllCollections
    )
    .get(
      '/:slug',
      {
        schema: {
          tags,
          security,
          params: SlugSchema,
          response: {
            200: CollectionWithSetsSchema,
          },
        },
      },
      getCollection
    )
}
