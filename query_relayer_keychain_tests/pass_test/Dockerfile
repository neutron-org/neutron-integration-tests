FROM neutron-org/neutron-query-relayer:base

COPY --from=neutron-node /go/bin/neutrond /bin/

RUN mv run.sh run-old.sh
RUN apt install pass -y

# preserve original run.sh
ADD --chmod=0755 run.sh .
ADD --chmod=0755 fake-pinentry.sh .

ENTRYPOINT ["/bin/bash", "run.sh"]
