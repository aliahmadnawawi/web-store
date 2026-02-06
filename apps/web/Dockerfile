FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_CATALOG_API
ARG NEXT_PUBLIC_ORDERS_API
ARG NEXT_PUBLIC_AI_API
ENV NEXT_PUBLIC_CATALOG_API=${NEXT_PUBLIC_CATALOG_API}
ENV NEXT_PUBLIC_ORDERS_API=${NEXT_PUBLIC_ORDERS_API}
ENV NEXT_PUBLIC_AI_API=${NEXT_PUBLIC_AI_API}
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
