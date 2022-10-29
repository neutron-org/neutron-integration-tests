FROM neutron-org/neutron-query-relayer

COPY --from=neutron-node /go/bin/neutrond /bin/

# preserve original run.sh
ADD --chmod=0755 run.sh .

ENTRYPOINT ["/bin/bash", "run.sh"]
