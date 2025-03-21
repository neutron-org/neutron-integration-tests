FROM golang:1.23-bullseye AS builder

WORKDIR /src/slinky
COPY --from=app go.mod .

RUN go mod download

COPY --from=app . .

RUN make build

FROM ubuntu:rolling
EXPOSE 8080
EXPOSE 8002

COPY --from=builder /src/slinky/build/* /usr/local/bin/
RUN apt-get update && apt-get install ca-certificates -y

WORKDIR /usr/local/bin/

ENTRYPOINT ["slinky"]
