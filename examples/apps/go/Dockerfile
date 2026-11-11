FROM golang:1.25-alpine AS build
WORKDIR /src
COPY . .
# release-notes/ was written by Taglore; main.go embeds it into the binary.
RUN CGO_ENABLED=0 go build -o /app .

FROM gcr.io/distroless/static
COPY --from=build /app /app
ENTRYPOINT ["/app"]
