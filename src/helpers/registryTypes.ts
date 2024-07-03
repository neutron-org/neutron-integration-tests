import { wasmTypes } from '@cosmjs/cosmwasm-stargate';
import { GeneratedType } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgSubmitProposalLegacy } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/tx';
import { ParameterChangeProposal } from '@neutron-org/neutronjs/cosmos/params/v1beta1/params';
import { MsgRemoveInterchainQueryRequest } from '@neutron-org/neutronjs/neutron/interchainqueries/tx';
import {
  MsgBurn,
  MsgChangeAdmin,
  MsgCreateDenom,
  MsgMint,
  MsgSetBeforeSendHook,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { MsgAuctionBid } from '@neutron-org/neutronjs/sdk/auction/v1/tx';

// TODO: use all types from @neutron-org/neutronjs library
export const neutronTypes: ReadonlyArray<[string, GeneratedType]> = [
  ...defaultRegistryTypes,
  ...wasmTypes,
  [MsgMint.typeUrl, MsgMint as any],
  [MsgCreateDenom.typeUrl, MsgCreateDenom as any],
  [MsgBurn.typeUrl, MsgBurn as any],
  [MsgChangeAdmin.typeUrl, MsgChangeAdmin as any],
  [MsgSetBeforeSendHook.typeUrl, MsgSetBeforeSendHook as any],
  [
    MsgRemoveInterchainQueryRequest.typeUrl,
    MsgRemoveInterchainQueryRequest as any,
  ],
  [MsgAuctionBid.typeUrl, MsgAuctionBid as any],
  [MsgSubmitProposalLegacy.typeUrl, MsgSubmitProposalLegacy as any],
  [ParameterChangeProposal.typeUrl, ParameterChangeProposal as any],
];
