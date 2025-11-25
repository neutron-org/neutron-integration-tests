import { wasmTypes } from '@cosmjs/cosmwasm-stargate';
import { GeneratedType } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { MsgSubmitProposalLegacy } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/tx';
import { ParameterChangeProposal } from '@neutron-org/neutronjs/cosmos/params/v1beta1/params';
import { MsgFundTreasury } from '@neutron-org/neutronjs/neutron/revenue/tx';
import { MsgRemoveInterchainQueryRequest } from '@neutron-org/neutronjs/neutron/interchainqueries/tx';
import { MsgUnjail } from 'cosmjs-types/cosmos/slashing/v1beta1/tx';
import {
  MsgBurn,
  MsgChangeAdmin,
  MsgCreateDenom,
  MsgMint,
  MsgSetBeforeSendHook,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import {
  MsgBurn as MsgBurn2,
  MsgChangeAdmin as MsgChangeAdmin2,
  MsgCreateDenom as MsgCreateDenom2,
  MsgMint as MsgMint2,
  MsgSetBeforeSendHook as MsgSetBeforeSendHook2,
} from '@neutron-org/neutronjs/neutron/coinfactory/v1beta1/tx';
import { MsgAuctionBid } from '@neutron-org/neutronjs/sdk/auction/v1/tx';
import { MsgCreateValidator } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/tx';

// TODO: use all types from @neutron-org/neutronjs library
export const neutronTypes: ReadonlyArray<[string, GeneratedType]> = [
  // bank, ibc, authz
  ...defaultRegistryTypes,
  // wasm
  ...wasmTypes,
  // tokenfactory
  [MsgMint.typeUrl, MsgMint as any],
  [MsgCreateDenom.typeUrl, MsgCreateDenom as any],
  [MsgBurn.typeUrl, MsgBurn as any],
  [MsgChangeAdmin.typeUrl, MsgChangeAdmin as any],
  [MsgSetBeforeSendHook.typeUrl, MsgSetBeforeSendHook as any],
  // coinfactory
  [MsgMint2.typeUrl, MsgMint2 as any],
  [MsgCreateDenom2.typeUrl, MsgCreateDenom2 as any],
  [MsgBurn2.typeUrl, MsgBurn2 as any],
  [MsgChangeAdmin2.typeUrl, MsgChangeAdmin2 as any],
  [MsgSetBeforeSendHook2.typeUrl, MsgSetBeforeSendHook2 as any],
  // interchainqueries
  [
    MsgRemoveInterchainQueryRequest.typeUrl,
    MsgRemoveInterchainQueryRequest as any,
  ],
  // skip-mev
  [MsgAuctionBid.typeUrl, MsgAuctionBid as any],
  // adminmodule
  [MsgSubmitProposalLegacy.typeUrl, MsgSubmitProposalLegacy as any],
  [ParameterChangeProposal.typeUrl, ParameterChangeProposal as any],
  // revenue
  [MsgFundTreasury.typeUrl, MsgFundTreasury as any],
  // slashing
  [MsgUnjail.typeUrl, MsgUnjail],
  // staking
  [MsgCreateValidator.typeUrl, MsgCreateValidator as any],
];
