// medusa-config.js — CommonJS, plain JS
const { defineConfig, Modules } = require("@medusajs/utils")

const env = process.env
const required = (k) => {
  const v = env[k]
  if (!v) throw new Error(`Missing required env: ${k}`)
  return v
}

const backendUrl = env.MEDUSA_BACKEND_URL || "http://localhost:9000"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: required("DATABASE_URL"),
    databaseLogging: false,
    redisUrl: env.REDIS_URL,
    workerMode: "shared",
    http: {
      adminCors: env.MEDUSA_ADMIN_CORS || "http://localhost:7001",
      authCors: env.MEDUSA_AUTH_CORS || "http://localhost:7001",
      storeCors: env.MEDUSA_STORE_CORS || "http://localhost:3000",
      jwtSecret: required("JWT_SECRET"),
      cookieSecret: required("COOKIE_SECRET"),
    },
    build: { rollupOptions: { external: ["@medusajs/dashboard"] } },
  },

  admin: {
    backendUrl,
    disable: false,
  },

  modules: [
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          ...(env.MINIO_ENDPOINT && env.MINIO_ACCESS_KEY && env.MINIO_SECRET_KEY
            ? [{
                resolve: "./src/modules/minio-file",
                id: "minio",
                options: {
                  endPoint: env.MINIO_ENDPOINT,
                  accessKey: env.MINIO_ACCESS_KEY,
                  secretKey: env.MINIO_SECRET_KEY,
                  bucket: env.MINIO_BUCKET || "medusa-media",
                },
              }]
            : [{
                resolve: "@medusajs/file-local",
                id: "local",
                options: {
                  upload_dir: "static",
                  backend_url: `${backendUrl}/static`,
                },
              }]),
        ],
      },
    },

    ...(env.REDIS_URL ? [
      { key: Modules.EVENT_BUS, resolve: "@medusajs/event-bus-redis", options: { redisUrl: env.REDIS_URL } },
      { key: Modules.WORKFLOW_ENGINE, resolve: "@medusajs/workflow-engine-redis", options: { redis: { url: env.REDIS_URL } } },
    ] : []),

    ...(((env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) ||
        (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)) ? [{
      key: Modules.NOTIFICATION,
      resolve: "@medusajs/notification",
      options: {
        providers: [
          ...(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL ? [{
            resolve: "@medusajs/notification-sendgrid",
            id: "sendgrid",
            options: { channels: ["email"], api_key: env.SENDGRID_API_KEY, from: env.SENDGRID_FROM_EMAIL },
          }] : []),
          ...(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? [{
            resolve: "./src/modules/email-notifications",
            id: "resend",
            options: { channels: ["email"], api_key: env.RESEND_API_KEY, from: env.RESEND_FROM_EMAIL },
          }] : []),
        ],
      },
    }] : []),

    ...((env.STRIPE_API_KEY && env.STRIPE_WEBHOOK_SECRET) ? [{
      key: Modules.PAYMENT,
      resolve: "@medusajs/payment",
      options: {
        providers: [{
          resolve: "@medusajs/payment-stripe",
          id: "stripe",
          options: { apiKey: env.STRIPE_API_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET },
        }],
      },
    }] : []),
  ],

  plugins: [
    ...((env.MEILISEARCH_HOST && env.MEILISEARCH_ADMIN_KEY) ? [{
      resolve: "@rokmohar/medusa-plugin-meilisearch",
      options: {
        config: { host: env.MEILISEARCH_HOST, apiKey: env.MEILISEARCH_ADMIN_KEY },
        settings: {
          products: {
            type: "products",
            enabled: true,
            fields: ["id","title","description","handle","variant_sku","thumbnail"],
            indexSettings: {
              searchableAttributes: ["title","description","variant_sku"],
              displayedAttributes: ["id","handle","title","description","variant_sku","thumbnail"],
              filterableAttributes: ["id","handle"],
            },
            primaryKey: "id",
          },
        },
      },
    }] : []),
  ],
})
