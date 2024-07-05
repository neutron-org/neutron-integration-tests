import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { createRPCQueryClient as createIbcClient } from '@neutron-org/neutronjs/ibc/rpc.query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type PromisedNeutronType = ReturnType<typeof createNeutronClient>;
export type PromisedIbcType = ReturnType<typeof createIbcClient>;
export type PromisedOsmosisType = ReturnType<typeof createOsmosisClient>;

export type NeutronType = UnwrapPromise<PromisedNeutronType>;
export type IbcType = UnwrapPromise<PromisedIbcType>;
export type OsmosisType = UnwrapPromise<PromisedOsmosisType>;
