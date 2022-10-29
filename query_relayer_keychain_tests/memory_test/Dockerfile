FROM neutron-org/neutron-query-relayer:base

RUN mv run.sh run-old.sh

# preserve original run.sh
ADD --chmod=0755 run.sh .

ENTRYPOINT ["/bin/bash", "run.sh"]
