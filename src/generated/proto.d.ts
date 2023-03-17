import * as $protobuf from "protobufjs";
/** Namespace neutron. */
export namespace neutron {

    /** Namespace contractmanager. */
    namespace contractmanager {

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: neutron.contractmanager.IQueryParamsRequest, callback: neutron.contractmanager.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: neutron.contractmanager.IQueryParamsRequest): Promise<neutron.contractmanager.QueryParamsResponse>;

            /**
             * Calls AddressFailures.
             * @param request QueryFailuresRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryFailuresResponse
             */
            public addressFailures(request: neutron.contractmanager.IQueryFailuresRequest, callback: neutron.contractmanager.Query.AddressFailuresCallback): void;

            /**
             * Calls AddressFailures.
             * @param request QueryFailuresRequest message or plain object
             * @returns Promise
             */
            public addressFailures(request: neutron.contractmanager.IQueryFailuresRequest): Promise<neutron.contractmanager.QueryFailuresResponse>;

            /**
             * Calls Failures.
             * @param request QueryFailuresRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryFailuresResponse
             */
            public failures(request: neutron.contractmanager.IQueryFailuresRequest, callback: neutron.contractmanager.Query.FailuresCallback): void;

            /**
             * Calls Failures.
             * @param request QueryFailuresRequest message or plain object
             * @returns Promise
             */
            public failures(request: neutron.contractmanager.IQueryFailuresRequest): Promise<neutron.contractmanager.QueryFailuresResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.contractmanager.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: neutron.contractmanager.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.contractmanager.Query#addressFailures}.
             * @param error Error, if any
             * @param [response] QueryFailuresResponse
             */
            type AddressFailuresCallback = (error: (Error|null), response?: neutron.contractmanager.QueryFailuresResponse) => void;

            /**
             * Callback as used by {@link neutron.contractmanager.Query#failures}.
             * @param error Error, if any
             * @param [response] QueryFailuresResponse
             */
            type FailuresCallback = (error: (Error|null), response?: neutron.contractmanager.QueryFailuresResponse) => void;
        }

        /** Properties of a QueryParamsRequest. */
        interface IQueryParamsRequest {
        }

        /** Represents a QueryParamsRequest. */
        class QueryParamsRequest implements IQueryParamsRequest {

            /**
             * Constructs a new QueryParamsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IQueryParamsRequest);

            /**
             * Encodes the specified QueryParamsRequest message. Does not implicitly {@link neutron.contractmanager.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link neutron.contractmanager.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.QueryParamsRequest;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.QueryParamsRequest;

            /**
             * Verifies a QueryParamsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.QueryParamsRequest;

            /**
             * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
             * @param message QueryParamsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryParamsResponse. */
        interface IQueryParamsResponse {

            /** QueryParamsResponse params */
            params?: (neutron.contractmanager.IParams|null);
        }

        /** Represents a QueryParamsResponse. */
        class QueryParamsResponse implements IQueryParamsResponse {

            /**
             * Constructs a new QueryParamsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IQueryParamsResponse);

            /** QueryParamsResponse params. */
            public params?: (neutron.contractmanager.IParams|null);

            /**
             * Encodes the specified QueryParamsResponse message. Does not implicitly {@link neutron.contractmanager.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link neutron.contractmanager.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.QueryParamsResponse;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.QueryParamsResponse;

            /**
             * Verifies a QueryParamsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.QueryParamsResponse;

            /**
             * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
             * @param message QueryParamsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryFailuresRequest. */
        interface IQueryFailuresRequest {

            /** QueryFailuresRequest address */
            address?: (string|null);

            /** QueryFailuresRequest pagination */
            pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);
        }

        /** Represents a QueryFailuresRequest. */
        class QueryFailuresRequest implements IQueryFailuresRequest {

            /**
             * Constructs a new QueryFailuresRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IQueryFailuresRequest);

            /** QueryFailuresRequest address. */
            public address: string;

            /** QueryFailuresRequest pagination. */
            public pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);

            /**
             * Encodes the specified QueryFailuresRequest message. Does not implicitly {@link neutron.contractmanager.QueryFailuresRequest.verify|verify} messages.
             * @param message QueryFailuresRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IQueryFailuresRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryFailuresRequest message, length delimited. Does not implicitly {@link neutron.contractmanager.QueryFailuresRequest.verify|verify} messages.
             * @param message QueryFailuresRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IQueryFailuresRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryFailuresRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryFailuresRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.QueryFailuresRequest;

            /**
             * Decodes a QueryFailuresRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryFailuresRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.QueryFailuresRequest;

            /**
             * Verifies a QueryFailuresRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryFailuresRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryFailuresRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.QueryFailuresRequest;

            /**
             * Creates a plain object from a QueryFailuresRequest message. Also converts values to other types if specified.
             * @param message QueryFailuresRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.QueryFailuresRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryFailuresRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryFailuresResponse. */
        interface IQueryFailuresResponse {

            /** QueryFailuresResponse failures */
            failures?: (neutron.contractmanager.IFailure[]|null);

            /** QueryFailuresResponse pagination */
            pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);
        }

        /** Represents a QueryFailuresResponse. */
        class QueryFailuresResponse implements IQueryFailuresResponse {

            /**
             * Constructs a new QueryFailuresResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IQueryFailuresResponse);

            /** QueryFailuresResponse failures. */
            public failures: neutron.contractmanager.IFailure[];

            /** QueryFailuresResponse pagination. */
            public pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);

            /**
             * Encodes the specified QueryFailuresResponse message. Does not implicitly {@link neutron.contractmanager.QueryFailuresResponse.verify|verify} messages.
             * @param message QueryFailuresResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IQueryFailuresResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryFailuresResponse message, length delimited. Does not implicitly {@link neutron.contractmanager.QueryFailuresResponse.verify|verify} messages.
             * @param message QueryFailuresResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IQueryFailuresResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryFailuresResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryFailuresResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.QueryFailuresResponse;

            /**
             * Decodes a QueryFailuresResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryFailuresResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.QueryFailuresResponse;

            /**
             * Verifies a QueryFailuresResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryFailuresResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryFailuresResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.QueryFailuresResponse;

            /**
             * Creates a plain object from a QueryFailuresResponse message. Also converts values to other types if specified.
             * @param message QueryFailuresResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.QueryFailuresResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryFailuresResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Params. */
        interface IParams {
        }

        /** Represents a Params. */
        class Params implements IParams {

            /**
             * Constructs a new Params.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IParams);

            /**
             * Encodes the specified Params message. Does not implicitly {@link neutron.contractmanager.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Params message, length delimited. Does not implicitly {@link neutron.contractmanager.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Params message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.Params;

            /**
             * Decodes a Params message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.Params;

            /**
             * Verifies a Params message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Params message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Params
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.Params;

            /**
             * Creates a plain object from a Params message. Also converts values to other types if specified.
             * @param message Params
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Params to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Failure. */
        interface IFailure {

            /** Failure channel_id */
            channel_id?: (string|null);

            /** Failure address */
            address?: (string|null);

            /** Failure id */
            id?: (Long|null);

            /** Failure ack_id */
            ack_id?: (Long|null);

            /** Failure ack_type */
            ack_type?: (string|null);
        }

        /** Represents a Failure. */
        class Failure implements IFailure {

            /**
             * Constructs a new Failure.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IFailure);

            /** Failure channel_id. */
            public channel_id: string;

            /** Failure address. */
            public address: string;

            /** Failure id. */
            public id: Long;

            /** Failure ack_id. */
            public ack_id: Long;

            /** Failure ack_type. */
            public ack_type: string;

            /**
             * Encodes the specified Failure message. Does not implicitly {@link neutron.contractmanager.Failure.verify|verify} messages.
             * @param message Failure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Failure message, length delimited. Does not implicitly {@link neutron.contractmanager.Failure.verify|verify} messages.
             * @param message Failure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Failure message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Failure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.Failure;

            /**
             * Decodes a Failure message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Failure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.Failure;

            /**
             * Verifies a Failure message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Failure message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Failure
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.Failure;

            /**
             * Creates a plain object from a Failure message. Also converts values to other types if specified.
             * @param message Failure
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.Failure, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Failure to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GenesisState. */
        interface IGenesisState {

            /** GenesisState params */
            params?: (neutron.contractmanager.IParams|null);

            /** GenesisState failures_list */
            failures_list?: (neutron.contractmanager.IFailure[]|null);
        }

        /** Represents a GenesisState. */
        class GenesisState implements IGenesisState {

            /**
             * Constructs a new GenesisState.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.contractmanager.IGenesisState);

            /** GenesisState params. */
            public params?: (neutron.contractmanager.IParams|null);

            /** GenesisState failures_list. */
            public failures_list: neutron.contractmanager.IFailure[];

            /**
             * Encodes the specified GenesisState message. Does not implicitly {@link neutron.contractmanager.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.contractmanager.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link neutron.contractmanager.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.contractmanager.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GenesisState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.contractmanager.GenesisState;

            /**
             * Decodes a GenesisState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.contractmanager.GenesisState;

            /**
             * Verifies a GenesisState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenesisState
             */
            public static fromObject(object: { [k: string]: any }): neutron.contractmanager.GenesisState;

            /**
             * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
             * @param message GenesisState
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.contractmanager.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GenesisState to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace feeburner. */
    namespace feeburner {

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: neutron.feeburner.IQueryParamsRequest, callback: neutron.feeburner.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: neutron.feeburner.IQueryParamsRequest): Promise<neutron.feeburner.QueryParamsResponse>;

            /**
             * Calls TotalBurnedNeutronsAmount.
             * @param request QueryTotalBurnedNeutronsAmountRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryTotalBurnedNeutronsAmountResponse
             */
            public totalBurnedNeutronsAmount(request: neutron.feeburner.IQueryTotalBurnedNeutronsAmountRequest, callback: neutron.feeburner.Query.TotalBurnedNeutronsAmountCallback): void;

            /**
             * Calls TotalBurnedNeutronsAmount.
             * @param request QueryTotalBurnedNeutronsAmountRequest message or plain object
             * @returns Promise
             */
            public totalBurnedNeutronsAmount(request: neutron.feeburner.IQueryTotalBurnedNeutronsAmountRequest): Promise<neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.feeburner.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: neutron.feeburner.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.feeburner.Query#totalBurnedNeutronsAmount}.
             * @param error Error, if any
             * @param [response] QueryTotalBurnedNeutronsAmountResponse
             */
            type TotalBurnedNeutronsAmountCallback = (error: (Error|null), response?: neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse) => void;
        }

        /** Properties of a QueryParamsRequest. */
        interface IQueryParamsRequest {
        }

        /** Represents a QueryParamsRequest. */
        class QueryParamsRequest implements IQueryParamsRequest {

            /**
             * Constructs a new QueryParamsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IQueryParamsRequest);

            /**
             * Encodes the specified QueryParamsRequest message. Does not implicitly {@link neutron.feeburner.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link neutron.feeburner.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.QueryParamsRequest;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.QueryParamsRequest;

            /**
             * Verifies a QueryParamsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.QueryParamsRequest;

            /**
             * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
             * @param message QueryParamsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryParamsResponse. */
        interface IQueryParamsResponse {

            /** QueryParamsResponse params */
            params?: (neutron.feeburner.IParams|null);
        }

        /** Represents a QueryParamsResponse. */
        class QueryParamsResponse implements IQueryParamsResponse {

            /**
             * Constructs a new QueryParamsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IQueryParamsResponse);

            /** QueryParamsResponse params. */
            public params?: (neutron.feeburner.IParams|null);

            /**
             * Encodes the specified QueryParamsResponse message. Does not implicitly {@link neutron.feeburner.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link neutron.feeburner.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.QueryParamsResponse;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.QueryParamsResponse;

            /**
             * Verifies a QueryParamsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.QueryParamsResponse;

            /**
             * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
             * @param message QueryParamsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryTotalBurnedNeutronsAmountRequest. */
        interface IQueryTotalBurnedNeutronsAmountRequest {
        }

        /** Represents a QueryTotalBurnedNeutronsAmountRequest. */
        class QueryTotalBurnedNeutronsAmountRequest implements IQueryTotalBurnedNeutronsAmountRequest {

            /**
             * Constructs a new QueryTotalBurnedNeutronsAmountRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IQueryTotalBurnedNeutronsAmountRequest);

            /**
             * Encodes the specified QueryTotalBurnedNeutronsAmountRequest message. Does not implicitly {@link neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest.verify|verify} messages.
             * @param message QueryTotalBurnedNeutronsAmountRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IQueryTotalBurnedNeutronsAmountRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryTotalBurnedNeutronsAmountRequest message, length delimited. Does not implicitly {@link neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest.verify|verify} messages.
             * @param message QueryTotalBurnedNeutronsAmountRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IQueryTotalBurnedNeutronsAmountRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryTotalBurnedNeutronsAmountRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryTotalBurnedNeutronsAmountRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest;

            /**
             * Decodes a QueryTotalBurnedNeutronsAmountRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryTotalBurnedNeutronsAmountRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest;

            /**
             * Verifies a QueryTotalBurnedNeutronsAmountRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryTotalBurnedNeutronsAmountRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryTotalBurnedNeutronsAmountRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest;

            /**
             * Creates a plain object from a QueryTotalBurnedNeutronsAmountRequest message. Also converts values to other types if specified.
             * @param message QueryTotalBurnedNeutronsAmountRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.QueryTotalBurnedNeutronsAmountRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryTotalBurnedNeutronsAmountRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryTotalBurnedNeutronsAmountResponse. */
        interface IQueryTotalBurnedNeutronsAmountResponse {

            /** QueryTotalBurnedNeutronsAmountResponse total_burned_neutrons_amount */
            total_burned_neutrons_amount?: (neutron.feeburner.ITotalBurnedNeutronsAmount|null);
        }

        /** Represents a QueryTotalBurnedNeutronsAmountResponse. */
        class QueryTotalBurnedNeutronsAmountResponse implements IQueryTotalBurnedNeutronsAmountResponse {

            /**
             * Constructs a new QueryTotalBurnedNeutronsAmountResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IQueryTotalBurnedNeutronsAmountResponse);

            /** QueryTotalBurnedNeutronsAmountResponse total_burned_neutrons_amount. */
            public total_burned_neutrons_amount?: (neutron.feeburner.ITotalBurnedNeutronsAmount|null);

            /**
             * Encodes the specified QueryTotalBurnedNeutronsAmountResponse message. Does not implicitly {@link neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse.verify|verify} messages.
             * @param message QueryTotalBurnedNeutronsAmountResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IQueryTotalBurnedNeutronsAmountResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryTotalBurnedNeutronsAmountResponse message, length delimited. Does not implicitly {@link neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse.verify|verify} messages.
             * @param message QueryTotalBurnedNeutronsAmountResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IQueryTotalBurnedNeutronsAmountResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryTotalBurnedNeutronsAmountResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryTotalBurnedNeutronsAmountResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse;

            /**
             * Decodes a QueryTotalBurnedNeutronsAmountResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryTotalBurnedNeutronsAmountResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse;

            /**
             * Verifies a QueryTotalBurnedNeutronsAmountResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryTotalBurnedNeutronsAmountResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryTotalBurnedNeutronsAmountResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse;

            /**
             * Creates a plain object from a QueryTotalBurnedNeutronsAmountResponse message. Also converts values to other types if specified.
             * @param message QueryTotalBurnedNeutronsAmountResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.QueryTotalBurnedNeutronsAmountResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryTotalBurnedNeutronsAmountResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Params. */
        interface IParams {

            /** Params neutron_denom */
            neutron_denom?: (string|null);

            /** Params treasury_address */
            treasury_address?: (string|null);
        }

        /** Represents a Params. */
        class Params implements IParams {

            /**
             * Constructs a new Params.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IParams);

            /** Params neutron_denom. */
            public neutron_denom: string;

            /** Params treasury_address. */
            public treasury_address: string;

            /**
             * Encodes the specified Params message. Does not implicitly {@link neutron.feeburner.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Params message, length delimited. Does not implicitly {@link neutron.feeburner.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Params message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.Params;

            /**
             * Decodes a Params message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.Params;

            /**
             * Verifies a Params message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Params message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Params
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.Params;

            /**
             * Creates a plain object from a Params message. Also converts values to other types if specified.
             * @param message Params
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Params to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TotalBurnedNeutronsAmount. */
        interface ITotalBurnedNeutronsAmount {

            /** TotalBurnedNeutronsAmount coin */
            coin?: (cosmos.base.v1beta1.ICoin|null);
        }

        /** Represents a TotalBurnedNeutronsAmount. */
        class TotalBurnedNeutronsAmount implements ITotalBurnedNeutronsAmount {

            /**
             * Constructs a new TotalBurnedNeutronsAmount.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.ITotalBurnedNeutronsAmount);

            /** TotalBurnedNeutronsAmount coin. */
            public coin?: (cosmos.base.v1beta1.ICoin|null);

            /**
             * Encodes the specified TotalBurnedNeutronsAmount message. Does not implicitly {@link neutron.feeburner.TotalBurnedNeutronsAmount.verify|verify} messages.
             * @param message TotalBurnedNeutronsAmount message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.ITotalBurnedNeutronsAmount, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TotalBurnedNeutronsAmount message, length delimited. Does not implicitly {@link neutron.feeburner.TotalBurnedNeutronsAmount.verify|verify} messages.
             * @param message TotalBurnedNeutronsAmount message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.ITotalBurnedNeutronsAmount, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TotalBurnedNeutronsAmount message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TotalBurnedNeutronsAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.TotalBurnedNeutronsAmount;

            /**
             * Decodes a TotalBurnedNeutronsAmount message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TotalBurnedNeutronsAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.TotalBurnedNeutronsAmount;

            /**
             * Verifies a TotalBurnedNeutronsAmount message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TotalBurnedNeutronsAmount message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TotalBurnedNeutronsAmount
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.TotalBurnedNeutronsAmount;

            /**
             * Creates a plain object from a TotalBurnedNeutronsAmount message. Also converts values to other types if specified.
             * @param message TotalBurnedNeutronsAmount
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.TotalBurnedNeutronsAmount, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TotalBurnedNeutronsAmount to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GenesisState. */
        interface IGenesisState {

            /** GenesisState params */
            params?: (neutron.feeburner.IParams|null);

            /** GenesisState total_burned_neutrons_amount */
            total_burned_neutrons_amount?: (neutron.feeburner.ITotalBurnedNeutronsAmount|null);
        }

        /** Represents a GenesisState. */
        class GenesisState implements IGenesisState {

            /**
             * Constructs a new GenesisState.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feeburner.IGenesisState);

            /** GenesisState params. */
            public params?: (neutron.feeburner.IParams|null);

            /** GenesisState total_burned_neutrons_amount. */
            public total_burned_neutrons_amount?: (neutron.feeburner.ITotalBurnedNeutronsAmount|null);

            /**
             * Encodes the specified GenesisState message. Does not implicitly {@link neutron.feeburner.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feeburner.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link neutron.feeburner.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feeburner.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GenesisState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feeburner.GenesisState;

            /**
             * Decodes a GenesisState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feeburner.GenesisState;

            /**
             * Verifies a GenesisState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenesisState
             */
            public static fromObject(object: { [k: string]: any }): neutron.feeburner.GenesisState;

            /**
             * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
             * @param message GenesisState
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feeburner.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GenesisState to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace feerefunder. */
    namespace feerefunder {

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: neutron.feerefunder.IQueryParamsRequest, callback: neutron.feerefunder.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: neutron.feerefunder.IQueryParamsRequest): Promise<neutron.feerefunder.QueryParamsResponse>;

            /**
             * Calls FeeInfo.
             * @param request FeeInfoRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and FeeInfoResponse
             */
            public feeInfo(request: neutron.feerefunder.IFeeInfoRequest, callback: neutron.feerefunder.Query.FeeInfoCallback): void;

            /**
             * Calls FeeInfo.
             * @param request FeeInfoRequest message or plain object
             * @returns Promise
             */
            public feeInfo(request: neutron.feerefunder.IFeeInfoRequest): Promise<neutron.feerefunder.FeeInfoResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.feerefunder.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: neutron.feerefunder.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.feerefunder.Query#feeInfo}.
             * @param error Error, if any
             * @param [response] FeeInfoResponse
             */
            type FeeInfoCallback = (error: (Error|null), response?: neutron.feerefunder.FeeInfoResponse) => void;
        }

        /** Properties of a QueryParamsRequest. */
        interface IQueryParamsRequest {
        }

        /** Represents a QueryParamsRequest. */
        class QueryParamsRequest implements IQueryParamsRequest {

            /**
             * Constructs a new QueryParamsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IQueryParamsRequest);

            /**
             * Encodes the specified QueryParamsRequest message. Does not implicitly {@link neutron.feerefunder.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link neutron.feerefunder.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.QueryParamsRequest;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.QueryParamsRequest;

            /**
             * Verifies a QueryParamsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.QueryParamsRequest;

            /**
             * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
             * @param message QueryParamsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryParamsResponse. */
        interface IQueryParamsResponse {

            /** QueryParamsResponse params */
            params?: (neutron.feerefunder.IParams|null);
        }

        /** Represents a QueryParamsResponse. */
        class QueryParamsResponse implements IQueryParamsResponse {

            /**
             * Constructs a new QueryParamsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IQueryParamsResponse);

            /** QueryParamsResponse params. */
            public params?: (neutron.feerefunder.IParams|null);

            /**
             * Encodes the specified QueryParamsResponse message. Does not implicitly {@link neutron.feerefunder.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link neutron.feerefunder.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.QueryParamsResponse;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.QueryParamsResponse;

            /**
             * Verifies a QueryParamsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.QueryParamsResponse;

            /**
             * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
             * @param message QueryParamsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FeeInfoRequest. */
        interface IFeeInfoRequest {

            /** FeeInfoRequest channel_id */
            channel_id?: (string|null);

            /** FeeInfoRequest port_id */
            port_id?: (string|null);

            /** FeeInfoRequest sequence */
            sequence?: (Long|null);
        }

        /** Represents a FeeInfoRequest. */
        class FeeInfoRequest implements IFeeInfoRequest {

            /**
             * Constructs a new FeeInfoRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IFeeInfoRequest);

            /** FeeInfoRequest channel_id. */
            public channel_id: string;

            /** FeeInfoRequest port_id. */
            public port_id: string;

            /** FeeInfoRequest sequence. */
            public sequence: Long;

            /**
             * Encodes the specified FeeInfoRequest message. Does not implicitly {@link neutron.feerefunder.FeeInfoRequest.verify|verify} messages.
             * @param message FeeInfoRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IFeeInfoRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FeeInfoRequest message, length delimited. Does not implicitly {@link neutron.feerefunder.FeeInfoRequest.verify|verify} messages.
             * @param message FeeInfoRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IFeeInfoRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeInfoRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FeeInfoRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.FeeInfoRequest;

            /**
             * Decodes a FeeInfoRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FeeInfoRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.FeeInfoRequest;

            /**
             * Verifies a FeeInfoRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FeeInfoRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FeeInfoRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.FeeInfoRequest;

            /**
             * Creates a plain object from a FeeInfoRequest message. Also converts values to other types if specified.
             * @param message FeeInfoRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.FeeInfoRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FeeInfoRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FeeInfoResponse. */
        interface IFeeInfoResponse {

            /** FeeInfoResponse fee_info */
            fee_info?: (neutron.feerefunder.IFeeInfo|null);
        }

        /** Represents a FeeInfoResponse. */
        class FeeInfoResponse implements IFeeInfoResponse {

            /**
             * Constructs a new FeeInfoResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IFeeInfoResponse);

            /** FeeInfoResponse fee_info. */
            public fee_info?: (neutron.feerefunder.IFeeInfo|null);

            /**
             * Encodes the specified FeeInfoResponse message. Does not implicitly {@link neutron.feerefunder.FeeInfoResponse.verify|verify} messages.
             * @param message FeeInfoResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IFeeInfoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FeeInfoResponse message, length delimited. Does not implicitly {@link neutron.feerefunder.FeeInfoResponse.verify|verify} messages.
             * @param message FeeInfoResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IFeeInfoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeInfoResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FeeInfoResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.FeeInfoResponse;

            /**
             * Decodes a FeeInfoResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FeeInfoResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.FeeInfoResponse;

            /**
             * Verifies a FeeInfoResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FeeInfoResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FeeInfoResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.FeeInfoResponse;

            /**
             * Creates a plain object from a FeeInfoResponse message. Also converts values to other types if specified.
             * @param message FeeInfoResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.FeeInfoResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FeeInfoResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Params. */
        interface IParams {

            /** Params min_fee */
            min_fee?: (neutron.feerefunder.IFee|null);
        }

        /** Represents a Params. */
        class Params implements IParams {

            /**
             * Constructs a new Params.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IParams);

            /** Params min_fee. */
            public min_fee?: (neutron.feerefunder.IFee|null);

            /**
             * Encodes the specified Params message. Does not implicitly {@link neutron.feerefunder.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Params message, length delimited. Does not implicitly {@link neutron.feerefunder.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Params message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.Params;

            /**
             * Decodes a Params message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.Params;

            /**
             * Verifies a Params message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Params message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Params
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.Params;

            /**
             * Creates a plain object from a Params message. Also converts values to other types if specified.
             * @param message Params
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Params to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Fee. */
        interface IFee {

            /** Fee recv_fee */
            recv_fee?: (cosmos.base.v1beta1.ICoin[]|null);

            /** Fee ack_fee */
            ack_fee?: (cosmos.base.v1beta1.ICoin[]|null);

            /** Fee timeout_fee */
            timeout_fee?: (cosmos.base.v1beta1.ICoin[]|null);
        }

        /** Represents a Fee. */
        class Fee implements IFee {

            /**
             * Constructs a new Fee.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IFee);

            /** Fee recv_fee. */
            public recv_fee: cosmos.base.v1beta1.ICoin[];

            /** Fee ack_fee. */
            public ack_fee: cosmos.base.v1beta1.ICoin[];

            /** Fee timeout_fee. */
            public timeout_fee: cosmos.base.v1beta1.ICoin[];

            /**
             * Encodes the specified Fee message. Does not implicitly {@link neutron.feerefunder.Fee.verify|verify} messages.
             * @param message Fee message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IFee, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Fee message, length delimited. Does not implicitly {@link neutron.feerefunder.Fee.verify|verify} messages.
             * @param message Fee message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IFee, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Fee message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Fee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.Fee;

            /**
             * Decodes a Fee message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Fee
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.Fee;

            /**
             * Verifies a Fee message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Fee message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Fee
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.Fee;

            /**
             * Creates a plain object from a Fee message. Also converts values to other types if specified.
             * @param message Fee
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.Fee, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Fee to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a PacketID. */
        interface IPacketID {

            /** PacketID channel_id */
            channel_id?: (string|null);

            /** PacketID port_id */
            port_id?: (string|null);

            /** PacketID sequence */
            sequence?: (Long|null);
        }

        /** Represents a PacketID. */
        class PacketID implements IPacketID {

            /**
             * Constructs a new PacketID.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IPacketID);

            /** PacketID channel_id. */
            public channel_id: string;

            /** PacketID port_id. */
            public port_id: string;

            /** PacketID sequence. */
            public sequence: Long;

            /**
             * Encodes the specified PacketID message. Does not implicitly {@link neutron.feerefunder.PacketID.verify|verify} messages.
             * @param message PacketID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IPacketID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PacketID message, length delimited. Does not implicitly {@link neutron.feerefunder.PacketID.verify|verify} messages.
             * @param message PacketID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IPacketID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PacketID message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PacketID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.PacketID;

            /**
             * Decodes a PacketID message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PacketID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.PacketID;

            /**
             * Verifies a PacketID message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PacketID message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PacketID
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.PacketID;

            /**
             * Creates a plain object from a PacketID message. Also converts values to other types if specified.
             * @param message PacketID
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.PacketID, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PacketID to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GenesisState. */
        interface IGenesisState {

            /** GenesisState params */
            params?: (neutron.feerefunder.IParams|null);

            /** GenesisState fee_infos */
            fee_infos?: (neutron.feerefunder.IFeeInfo[]|null);
        }

        /** Represents a GenesisState. */
        class GenesisState implements IGenesisState {

            /**
             * Constructs a new GenesisState.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IGenesisState);

            /** GenesisState params. */
            public params?: (neutron.feerefunder.IParams|null);

            /** GenesisState fee_infos. */
            public fee_infos: neutron.feerefunder.IFeeInfo[];

            /**
             * Encodes the specified GenesisState message. Does not implicitly {@link neutron.feerefunder.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link neutron.feerefunder.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GenesisState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.GenesisState;

            /**
             * Decodes a GenesisState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.GenesisState;

            /**
             * Verifies a GenesisState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenesisState
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.GenesisState;

            /**
             * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
             * @param message GenesisState
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GenesisState to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FeeInfo. */
        interface IFeeInfo {

            /** FeeInfo payer */
            payer?: (string|null);

            /** FeeInfo packet_id */
            packet_id?: (neutron.feerefunder.IPacketID|null);

            /** FeeInfo fee */
            fee?: (neutron.feerefunder.IFee|null);
        }

        /** Represents a FeeInfo. */
        class FeeInfo implements IFeeInfo {

            /**
             * Constructs a new FeeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.feerefunder.IFeeInfo);

            /** FeeInfo payer. */
            public payer: string;

            /** FeeInfo packet_id. */
            public packet_id?: (neutron.feerefunder.IPacketID|null);

            /** FeeInfo fee. */
            public fee?: (neutron.feerefunder.IFee|null);

            /**
             * Encodes the specified FeeInfo message. Does not implicitly {@link neutron.feerefunder.FeeInfo.verify|verify} messages.
             * @param message FeeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.feerefunder.IFeeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FeeInfo message, length delimited. Does not implicitly {@link neutron.feerefunder.FeeInfo.verify|verify} messages.
             * @param message FeeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.feerefunder.IFeeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FeeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.feerefunder.FeeInfo;

            /**
             * Decodes a FeeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FeeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.feerefunder.FeeInfo;

            /**
             * Verifies a FeeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FeeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FeeInfo
             */
            public static fromObject(object: { [k: string]: any }): neutron.feerefunder.FeeInfo;

            /**
             * Creates a plain object from a FeeInfo message. Also converts values to other types if specified.
             * @param message FeeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.feerefunder.FeeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FeeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace interchainqueries. */
    namespace interchainqueries {

        /** Represents a Msg */
        class Msg extends $protobuf.rpc.Service {

            /**
             * Constructs a new Msg service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls RegisterInterchainQuery.
             * @param request MsgRegisterInterchainQuery message or plain object
             * @param callback Node-style callback called with the error, if any, and MsgRegisterInterchainQueryResponse
             */
            public registerInterchainQuery(request: neutron.interchainqueries.IMsgRegisterInterchainQuery, callback: neutron.interchainqueries.Msg.RegisterInterchainQueryCallback): void;

            /**
             * Calls RegisterInterchainQuery.
             * @param request MsgRegisterInterchainQuery message or plain object
             * @returns Promise
             */
            public registerInterchainQuery(request: neutron.interchainqueries.IMsgRegisterInterchainQuery): Promise<neutron.interchainqueries.MsgRegisterInterchainQueryResponse>;

            /**
             * Calls SubmitQueryResult.
             * @param request MsgSubmitQueryResult message or plain object
             * @param callback Node-style callback called with the error, if any, and MsgSubmitQueryResultResponse
             */
            public submitQueryResult(request: neutron.interchainqueries.IMsgSubmitQueryResult, callback: neutron.interchainqueries.Msg.SubmitQueryResultCallback): void;

            /**
             * Calls SubmitQueryResult.
             * @param request MsgSubmitQueryResult message or plain object
             * @returns Promise
             */
            public submitQueryResult(request: neutron.interchainqueries.IMsgSubmitQueryResult): Promise<neutron.interchainqueries.MsgSubmitQueryResultResponse>;

            /**
             * Calls RemoveInterchainQuery.
             * @param request MsgRemoveInterchainQueryRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and MsgRemoveInterchainQueryResponse
             */
            public removeInterchainQuery(request: neutron.interchainqueries.IMsgRemoveInterchainQueryRequest, callback: neutron.interchainqueries.Msg.RemoveInterchainQueryCallback): void;

            /**
             * Calls RemoveInterchainQuery.
             * @param request MsgRemoveInterchainQueryRequest message or plain object
             * @returns Promise
             */
            public removeInterchainQuery(request: neutron.interchainqueries.IMsgRemoveInterchainQueryRequest): Promise<neutron.interchainqueries.MsgRemoveInterchainQueryResponse>;

            /**
             * Calls UpdateInterchainQuery.
             * @param request MsgUpdateInterchainQueryRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and MsgUpdateInterchainQueryResponse
             */
            public updateInterchainQuery(request: neutron.interchainqueries.IMsgUpdateInterchainQueryRequest, callback: neutron.interchainqueries.Msg.UpdateInterchainQueryCallback): void;

            /**
             * Calls UpdateInterchainQuery.
             * @param request MsgUpdateInterchainQueryRequest message or plain object
             * @returns Promise
             */
            public updateInterchainQuery(request: neutron.interchainqueries.IMsgUpdateInterchainQueryRequest): Promise<neutron.interchainqueries.MsgUpdateInterchainQueryResponse>;
        }

        namespace Msg {

            /**
             * Callback as used by {@link neutron.interchainqueries.Msg#registerInterchainQuery}.
             * @param error Error, if any
             * @param [response] MsgRegisterInterchainQueryResponse
             */
            type RegisterInterchainQueryCallback = (error: (Error|null), response?: neutron.interchainqueries.MsgRegisterInterchainQueryResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Msg#submitQueryResult}.
             * @param error Error, if any
             * @param [response] MsgSubmitQueryResultResponse
             */
            type SubmitQueryResultCallback = (error: (Error|null), response?: neutron.interchainqueries.MsgSubmitQueryResultResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Msg#removeInterchainQuery}.
             * @param error Error, if any
             * @param [response] MsgRemoveInterchainQueryResponse
             */
            type RemoveInterchainQueryCallback = (error: (Error|null), response?: neutron.interchainqueries.MsgRemoveInterchainQueryResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Msg#updateInterchainQuery}.
             * @param error Error, if any
             * @param [response] MsgUpdateInterchainQueryResponse
             */
            type UpdateInterchainQueryCallback = (error: (Error|null), response?: neutron.interchainqueries.MsgUpdateInterchainQueryResponse) => void;
        }

        /** Properties of a MsgRegisterInterchainQuery. */
        interface IMsgRegisterInterchainQuery {

            /** MsgRegisterInterchainQuery query_type */
            query_type?: (string|null);

            /** MsgRegisterInterchainQuery keys */
            keys?: (neutron.interchainqueries.IKVKey[]|null);

            /** MsgRegisterInterchainQuery transactions_filter */
            transactions_filter?: (string|null);

            /** MsgRegisterInterchainQuery connection_id */
            connection_id?: (string|null);

            /** MsgRegisterInterchainQuery update_period */
            update_period?: (Long|null);

            /** MsgRegisterInterchainQuery sender */
            sender?: (string|null);
        }

        /** Represents a MsgRegisterInterchainQuery. */
        class MsgRegisterInterchainQuery implements IMsgRegisterInterchainQuery {

            /**
             * Constructs a new MsgRegisterInterchainQuery.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgRegisterInterchainQuery);

            /** MsgRegisterInterchainQuery query_type. */
            public query_type: string;

            /** MsgRegisterInterchainQuery keys. */
            public keys: neutron.interchainqueries.IKVKey[];

            /** MsgRegisterInterchainQuery transactions_filter. */
            public transactions_filter: string;

            /** MsgRegisterInterchainQuery connection_id. */
            public connection_id: string;

            /** MsgRegisterInterchainQuery update_period. */
            public update_period: Long;

            /** MsgRegisterInterchainQuery sender. */
            public sender: string;

            /**
             * Encodes the specified MsgRegisterInterchainQuery message. Does not implicitly {@link neutron.interchainqueries.MsgRegisterInterchainQuery.verify|verify} messages.
             * @param message MsgRegisterInterchainQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgRegisterInterchainQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgRegisterInterchainQuery message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgRegisterInterchainQuery.verify|verify} messages.
             * @param message MsgRegisterInterchainQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgRegisterInterchainQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgRegisterInterchainQuery message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgRegisterInterchainQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgRegisterInterchainQuery;

            /**
             * Decodes a MsgRegisterInterchainQuery message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgRegisterInterchainQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgRegisterInterchainQuery;

            /**
             * Verifies a MsgRegisterInterchainQuery message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgRegisterInterchainQuery message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgRegisterInterchainQuery
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgRegisterInterchainQuery;

            /**
             * Creates a plain object from a MsgRegisterInterchainQuery message. Also converts values to other types if specified.
             * @param message MsgRegisterInterchainQuery
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgRegisterInterchainQuery, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgRegisterInterchainQuery to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgRegisterInterchainQueryResponse. */
        interface IMsgRegisterInterchainQueryResponse {

            /** MsgRegisterInterchainQueryResponse id */
            id?: (Long|null);
        }

        /** Represents a MsgRegisterInterchainQueryResponse. */
        class MsgRegisterInterchainQueryResponse implements IMsgRegisterInterchainQueryResponse {

            /**
             * Constructs a new MsgRegisterInterchainQueryResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgRegisterInterchainQueryResponse);

            /** MsgRegisterInterchainQueryResponse id. */
            public id: Long;

            /**
             * Encodes the specified MsgRegisterInterchainQueryResponse message. Does not implicitly {@link neutron.interchainqueries.MsgRegisterInterchainQueryResponse.verify|verify} messages.
             * @param message MsgRegisterInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgRegisterInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgRegisterInterchainQueryResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgRegisterInterchainQueryResponse.verify|verify} messages.
             * @param message MsgRegisterInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgRegisterInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgRegisterInterchainQueryResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgRegisterInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgRegisterInterchainQueryResponse;

            /**
             * Decodes a MsgRegisterInterchainQueryResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgRegisterInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgRegisterInterchainQueryResponse;

            /**
             * Verifies a MsgRegisterInterchainQueryResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgRegisterInterchainQueryResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgRegisterInterchainQueryResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgRegisterInterchainQueryResponse;

            /**
             * Creates a plain object from a MsgRegisterInterchainQueryResponse message. Also converts values to other types if specified.
             * @param message MsgRegisterInterchainQueryResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgRegisterInterchainQueryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgRegisterInterchainQueryResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgSubmitQueryResult. */
        interface IMsgSubmitQueryResult {

            /** MsgSubmitQueryResult query_id */
            query_id?: (Long|null);

            /** MsgSubmitQueryResult sender */
            sender?: (string|null);

            /** MsgSubmitQueryResult client_id */
            client_id?: (string|null);

            /** MsgSubmitQueryResult result */
            result?: (neutron.interchainqueries.IQueryResult|null);
        }

        /** Represents a MsgSubmitQueryResult. */
        class MsgSubmitQueryResult implements IMsgSubmitQueryResult {

            /**
             * Constructs a new MsgSubmitQueryResult.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgSubmitQueryResult);

            /** MsgSubmitQueryResult query_id. */
            public query_id: Long;

            /** MsgSubmitQueryResult sender. */
            public sender: string;

            /** MsgSubmitQueryResult client_id. */
            public client_id: string;

            /** MsgSubmitQueryResult result. */
            public result?: (neutron.interchainqueries.IQueryResult|null);

            /**
             * Encodes the specified MsgSubmitQueryResult message. Does not implicitly {@link neutron.interchainqueries.MsgSubmitQueryResult.verify|verify} messages.
             * @param message MsgSubmitQueryResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgSubmitQueryResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgSubmitQueryResult message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgSubmitQueryResult.verify|verify} messages.
             * @param message MsgSubmitQueryResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgSubmitQueryResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgSubmitQueryResult message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgSubmitQueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgSubmitQueryResult;

            /**
             * Decodes a MsgSubmitQueryResult message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgSubmitQueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgSubmitQueryResult;

            /**
             * Verifies a MsgSubmitQueryResult message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgSubmitQueryResult message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgSubmitQueryResult
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgSubmitQueryResult;

            /**
             * Creates a plain object from a MsgSubmitQueryResult message. Also converts values to other types if specified.
             * @param message MsgSubmitQueryResult
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgSubmitQueryResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgSubmitQueryResult to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryResult. */
        interface IQueryResult {

            /** QueryResult kv_results */
            kv_results?: (neutron.interchainqueries.IStorageValue[]|null);

            /** QueryResult block */
            block?: (neutron.interchainqueries.IBlock|null);

            /** QueryResult height */
            height?: (Long|null);

            /** QueryResult revision */
            revision?: (Long|null);

            /** QueryResult allow_kv_callbacks */
            allow_kv_callbacks?: (boolean|null);
        }

        /** Represents a QueryResult. */
        class QueryResult implements IQueryResult {

            /**
             * Constructs a new QueryResult.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryResult);

            /** QueryResult kv_results. */
            public kv_results: neutron.interchainqueries.IStorageValue[];

            /** QueryResult block. */
            public block?: (neutron.interchainqueries.IBlock|null);

            /** QueryResult height. */
            public height: Long;

            /** QueryResult revision. */
            public revision: Long;

            /** QueryResult allow_kv_callbacks. */
            public allow_kv_callbacks: boolean;

            /**
             * Encodes the specified QueryResult message. Does not implicitly {@link neutron.interchainqueries.QueryResult.verify|verify} messages.
             * @param message QueryResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryResult message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryResult.verify|verify} messages.
             * @param message QueryResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryResult message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryResult;

            /**
             * Decodes a QueryResult message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryResult;

            /**
             * Verifies a QueryResult message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryResult message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryResult
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryResult;

            /**
             * Creates a plain object from a QueryResult message. Also converts values to other types if specified.
             * @param message QueryResult
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryResult to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a StorageValue. */
        interface IStorageValue {

            /** StorageValue storage_prefix */
            storage_prefix?: (string|null);

            /** StorageValue key */
            key?: (Uint8Array|null);

            /** StorageValue value */
            value?: (Uint8Array|null);

            /** StorageValue Proof */
            Proof?: (tendermint.crypto.IProofOps|null);
        }

        /** Represents a StorageValue. */
        class StorageValue implements IStorageValue {

            /**
             * Constructs a new StorageValue.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IStorageValue);

            /** StorageValue storage_prefix. */
            public storage_prefix: string;

            /** StorageValue key. */
            public key: Uint8Array;

            /** StorageValue value. */
            public value: Uint8Array;

            /** StorageValue Proof. */
            public Proof?: (tendermint.crypto.IProofOps|null);

            /**
             * Encodes the specified StorageValue message. Does not implicitly {@link neutron.interchainqueries.StorageValue.verify|verify} messages.
             * @param message StorageValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IStorageValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified StorageValue message, length delimited. Does not implicitly {@link neutron.interchainqueries.StorageValue.verify|verify} messages.
             * @param message StorageValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IStorageValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a StorageValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns StorageValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.StorageValue;

            /**
             * Decodes a StorageValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns StorageValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.StorageValue;

            /**
             * Verifies a StorageValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a StorageValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns StorageValue
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.StorageValue;

            /**
             * Creates a plain object from a StorageValue message. Also converts values to other types if specified.
             * @param message StorageValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.StorageValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this StorageValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Block. */
        interface IBlock {

            /** Block next_block_header */
            next_block_header?: (google.protobuf.IAny|null);

            /** Block header */
            header?: (google.protobuf.IAny|null);

            /** Block tx */
            tx?: (neutron.interchainqueries.ITxValue|null);
        }

        /** Represents a Block. */
        class Block implements IBlock {

            /**
             * Constructs a new Block.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IBlock);

            /** Block next_block_header. */
            public next_block_header?: (google.protobuf.IAny|null);

            /** Block header. */
            public header?: (google.protobuf.IAny|null);

            /** Block tx. */
            public tx?: (neutron.interchainqueries.ITxValue|null);

            /**
             * Encodes the specified Block message. Does not implicitly {@link neutron.interchainqueries.Block.verify|verify} messages.
             * @param message Block message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Block message, length delimited. Does not implicitly {@link neutron.interchainqueries.Block.verify|verify} messages.
             * @param message Block message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Block message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Block
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.Block;

            /**
             * Decodes a Block message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Block
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.Block;

            /**
             * Verifies a Block message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Block message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Block
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.Block;

            /**
             * Creates a plain object from a Block message. Also converts values to other types if specified.
             * @param message Block
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.Block, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Block to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TxValue. */
        interface ITxValue {

            /** TxValue response */
            response?: (tendermint.abci.IResponseDeliverTx|null);

            /** TxValue delivery_proof */
            delivery_proof?: (tendermint.crypto.IProof|null);

            /** TxValue inclusion_proof */
            inclusion_proof?: (tendermint.crypto.IProof|null);

            /** TxValue data */
            data?: (Uint8Array|null);
        }

        /** Represents a TxValue. */
        class TxValue implements ITxValue {

            /**
             * Constructs a new TxValue.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.ITxValue);

            /** TxValue response. */
            public response?: (tendermint.abci.IResponseDeliverTx|null);

            /** TxValue delivery_proof. */
            public delivery_proof?: (tendermint.crypto.IProof|null);

            /** TxValue inclusion_proof. */
            public inclusion_proof?: (tendermint.crypto.IProof|null);

            /** TxValue data. */
            public data: Uint8Array;

            /**
             * Encodes the specified TxValue message. Does not implicitly {@link neutron.interchainqueries.TxValue.verify|verify} messages.
             * @param message TxValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.ITxValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TxValue message, length delimited. Does not implicitly {@link neutron.interchainqueries.TxValue.verify|verify} messages.
             * @param message TxValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.ITxValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TxValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TxValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.TxValue;

            /**
             * Decodes a TxValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TxValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.TxValue;

            /**
             * Verifies a TxValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TxValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TxValue
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.TxValue;

            /**
             * Creates a plain object from a TxValue message. Also converts values to other types if specified.
             * @param message TxValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.TxValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TxValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgSubmitQueryResultResponse. */
        interface IMsgSubmitQueryResultResponse {
        }

        /** Represents a MsgSubmitQueryResultResponse. */
        class MsgSubmitQueryResultResponse implements IMsgSubmitQueryResultResponse {

            /**
             * Constructs a new MsgSubmitQueryResultResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgSubmitQueryResultResponse);

            /**
             * Encodes the specified MsgSubmitQueryResultResponse message. Does not implicitly {@link neutron.interchainqueries.MsgSubmitQueryResultResponse.verify|verify} messages.
             * @param message MsgSubmitQueryResultResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgSubmitQueryResultResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgSubmitQueryResultResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgSubmitQueryResultResponse.verify|verify} messages.
             * @param message MsgSubmitQueryResultResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgSubmitQueryResultResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgSubmitQueryResultResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgSubmitQueryResultResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgSubmitQueryResultResponse;

            /**
             * Decodes a MsgSubmitQueryResultResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgSubmitQueryResultResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgSubmitQueryResultResponse;

            /**
             * Verifies a MsgSubmitQueryResultResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgSubmitQueryResultResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgSubmitQueryResultResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgSubmitQueryResultResponse;

            /**
             * Creates a plain object from a MsgSubmitQueryResultResponse message. Also converts values to other types if specified.
             * @param message MsgSubmitQueryResultResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgSubmitQueryResultResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgSubmitQueryResultResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgRemoveInterchainQueryRequest. */
        interface IMsgRemoveInterchainQueryRequest {

            /** MsgRemoveInterchainQueryRequest query_id */
            query_id?: (Long|null);

            /** MsgRemoveInterchainQueryRequest sender */
            sender?: (string|null);
        }

        /** Represents a MsgRemoveInterchainQueryRequest. */
        class MsgRemoveInterchainQueryRequest implements IMsgRemoveInterchainQueryRequest {

            /**
             * Constructs a new MsgRemoveInterchainQueryRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgRemoveInterchainQueryRequest);

            /** MsgRemoveInterchainQueryRequest query_id. */
            public query_id: Long;

            /** MsgRemoveInterchainQueryRequest sender. */
            public sender: string;

            /**
             * Encodes the specified MsgRemoveInterchainQueryRequest message. Does not implicitly {@link neutron.interchainqueries.MsgRemoveInterchainQueryRequest.verify|verify} messages.
             * @param message MsgRemoveInterchainQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgRemoveInterchainQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgRemoveInterchainQueryRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgRemoveInterchainQueryRequest.verify|verify} messages.
             * @param message MsgRemoveInterchainQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgRemoveInterchainQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgRemoveInterchainQueryRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgRemoveInterchainQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgRemoveInterchainQueryRequest;

            /**
             * Decodes a MsgRemoveInterchainQueryRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgRemoveInterchainQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgRemoveInterchainQueryRequest;

            /**
             * Verifies a MsgRemoveInterchainQueryRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgRemoveInterchainQueryRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgRemoveInterchainQueryRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgRemoveInterchainQueryRequest;

            /**
             * Creates a plain object from a MsgRemoveInterchainQueryRequest message. Also converts values to other types if specified.
             * @param message MsgRemoveInterchainQueryRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgRemoveInterchainQueryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgRemoveInterchainQueryRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgRemoveInterchainQueryResponse. */
        interface IMsgRemoveInterchainQueryResponse {
        }

        /** Represents a MsgRemoveInterchainQueryResponse. */
        class MsgRemoveInterchainQueryResponse implements IMsgRemoveInterchainQueryResponse {

            /**
             * Constructs a new MsgRemoveInterchainQueryResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgRemoveInterchainQueryResponse);

            /**
             * Encodes the specified MsgRemoveInterchainQueryResponse message. Does not implicitly {@link neutron.interchainqueries.MsgRemoveInterchainQueryResponse.verify|verify} messages.
             * @param message MsgRemoveInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgRemoveInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgRemoveInterchainQueryResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgRemoveInterchainQueryResponse.verify|verify} messages.
             * @param message MsgRemoveInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgRemoveInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgRemoveInterchainQueryResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgRemoveInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgRemoveInterchainQueryResponse;

            /**
             * Decodes a MsgRemoveInterchainQueryResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgRemoveInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgRemoveInterchainQueryResponse;

            /**
             * Verifies a MsgRemoveInterchainQueryResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgRemoveInterchainQueryResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgRemoveInterchainQueryResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgRemoveInterchainQueryResponse;

            /**
             * Creates a plain object from a MsgRemoveInterchainQueryResponse message. Also converts values to other types if specified.
             * @param message MsgRemoveInterchainQueryResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgRemoveInterchainQueryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgRemoveInterchainQueryResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgUpdateInterchainQueryRequest. */
        interface IMsgUpdateInterchainQueryRequest {

            /** MsgUpdateInterchainQueryRequest query_id */
            query_id?: (Long|null);

            /** MsgUpdateInterchainQueryRequest new_keys */
            new_keys?: (neutron.interchainqueries.IKVKey[]|null);

            /** MsgUpdateInterchainQueryRequest new_update_period */
            new_update_period?: (Long|null);

            /** MsgUpdateInterchainQueryRequest new_transactions_filter */
            new_transactions_filter?: (string|null);

            /** MsgUpdateInterchainQueryRequest sender */
            sender?: (string|null);
        }

        /** Represents a MsgUpdateInterchainQueryRequest. */
        class MsgUpdateInterchainQueryRequest implements IMsgUpdateInterchainQueryRequest {

            /**
             * Constructs a new MsgUpdateInterchainQueryRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgUpdateInterchainQueryRequest);

            /** MsgUpdateInterchainQueryRequest query_id. */
            public query_id: Long;

            /** MsgUpdateInterchainQueryRequest new_keys. */
            public new_keys: neutron.interchainqueries.IKVKey[];

            /** MsgUpdateInterchainQueryRequest new_update_period. */
            public new_update_period: Long;

            /** MsgUpdateInterchainQueryRequest new_transactions_filter. */
            public new_transactions_filter: string;

            /** MsgUpdateInterchainQueryRequest sender. */
            public sender: string;

            /**
             * Encodes the specified MsgUpdateInterchainQueryRequest message. Does not implicitly {@link neutron.interchainqueries.MsgUpdateInterchainQueryRequest.verify|verify} messages.
             * @param message MsgUpdateInterchainQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgUpdateInterchainQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgUpdateInterchainQueryRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgUpdateInterchainQueryRequest.verify|verify} messages.
             * @param message MsgUpdateInterchainQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgUpdateInterchainQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgUpdateInterchainQueryRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgUpdateInterchainQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgUpdateInterchainQueryRequest;

            /**
             * Decodes a MsgUpdateInterchainQueryRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgUpdateInterchainQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgUpdateInterchainQueryRequest;

            /**
             * Verifies a MsgUpdateInterchainQueryRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgUpdateInterchainQueryRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgUpdateInterchainQueryRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgUpdateInterchainQueryRequest;

            /**
             * Creates a plain object from a MsgUpdateInterchainQueryRequest message. Also converts values to other types if specified.
             * @param message MsgUpdateInterchainQueryRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgUpdateInterchainQueryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgUpdateInterchainQueryRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgUpdateInterchainQueryResponse. */
        interface IMsgUpdateInterchainQueryResponse {
        }

        /** Represents a MsgUpdateInterchainQueryResponse. */
        class MsgUpdateInterchainQueryResponse implements IMsgUpdateInterchainQueryResponse {

            /**
             * Constructs a new MsgUpdateInterchainQueryResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IMsgUpdateInterchainQueryResponse);

            /**
             * Encodes the specified MsgUpdateInterchainQueryResponse message. Does not implicitly {@link neutron.interchainqueries.MsgUpdateInterchainQueryResponse.verify|verify} messages.
             * @param message MsgUpdateInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IMsgUpdateInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgUpdateInterchainQueryResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.MsgUpdateInterchainQueryResponse.verify|verify} messages.
             * @param message MsgUpdateInterchainQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IMsgUpdateInterchainQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgUpdateInterchainQueryResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgUpdateInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.MsgUpdateInterchainQueryResponse;

            /**
             * Decodes a MsgUpdateInterchainQueryResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgUpdateInterchainQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.MsgUpdateInterchainQueryResponse;

            /**
             * Verifies a MsgUpdateInterchainQueryResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgUpdateInterchainQueryResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgUpdateInterchainQueryResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.MsgUpdateInterchainQueryResponse;

            /**
             * Creates a plain object from a MsgUpdateInterchainQueryResponse message. Also converts values to other types if specified.
             * @param message MsgUpdateInterchainQueryResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.MsgUpdateInterchainQueryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgUpdateInterchainQueryResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RegisteredQuery. */
        interface IRegisteredQuery {

            /** RegisteredQuery id */
            id?: (Long|null);

            /** RegisteredQuery owner */
            owner?: (string|null);

            /** RegisteredQuery query_type */
            query_type?: (string|null);

            /** RegisteredQuery keys */
            keys?: (neutron.interchainqueries.IKVKey[]|null);

            /** RegisteredQuery transactions_filter */
            transactions_filter?: (string|null);

            /** RegisteredQuery connection_id */
            connection_id?: (string|null);

            /** RegisteredQuery update_period */
            update_period?: (Long|null);

            /** RegisteredQuery last_submitted_result_local_height */
            last_submitted_result_local_height?: (Long|null);

            /** RegisteredQuery last_submitted_result_remote_height */
            last_submitted_result_remote_height?: (Long|null);

            /** RegisteredQuery deposit */
            deposit?: (cosmos.base.v1beta1.ICoin[]|null);

            /** RegisteredQuery submit_timeout */
            submit_timeout?: (Long|null);

            /** RegisteredQuery registered_at_height */
            registered_at_height?: (Long|null);
        }

        /** Represents a RegisteredQuery. */
        class RegisteredQuery implements IRegisteredQuery {

            /**
             * Constructs a new RegisteredQuery.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IRegisteredQuery);

            /** RegisteredQuery id. */
            public id: Long;

            /** RegisteredQuery owner. */
            public owner: string;

            /** RegisteredQuery query_type. */
            public query_type: string;

            /** RegisteredQuery keys. */
            public keys: neutron.interchainqueries.IKVKey[];

            /** RegisteredQuery transactions_filter. */
            public transactions_filter: string;

            /** RegisteredQuery connection_id. */
            public connection_id: string;

            /** RegisteredQuery update_period. */
            public update_period: Long;

            /** RegisteredQuery last_submitted_result_local_height. */
            public last_submitted_result_local_height: Long;

            /** RegisteredQuery last_submitted_result_remote_height. */
            public last_submitted_result_remote_height: Long;

            /** RegisteredQuery deposit. */
            public deposit: cosmos.base.v1beta1.ICoin[];

            /** RegisteredQuery submit_timeout. */
            public submit_timeout: Long;

            /** RegisteredQuery registered_at_height. */
            public registered_at_height: Long;

            /**
             * Encodes the specified RegisteredQuery message. Does not implicitly {@link neutron.interchainqueries.RegisteredQuery.verify|verify} messages.
             * @param message RegisteredQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IRegisteredQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RegisteredQuery message, length delimited. Does not implicitly {@link neutron.interchainqueries.RegisteredQuery.verify|verify} messages.
             * @param message RegisteredQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IRegisteredQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RegisteredQuery message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RegisteredQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.RegisteredQuery;

            /**
             * Decodes a RegisteredQuery message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RegisteredQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.RegisteredQuery;

            /**
             * Verifies a RegisteredQuery message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RegisteredQuery message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RegisteredQuery
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.RegisteredQuery;

            /**
             * Creates a plain object from a RegisteredQuery message. Also converts values to other types if specified.
             * @param message RegisteredQuery
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.RegisteredQuery, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RegisteredQuery to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a KVKey. */
        interface IKVKey {

            /** KVKey path */
            path?: (string|null);

            /** KVKey key */
            key?: (Uint8Array|null);
        }

        /** Represents a KVKey. */
        class KVKey implements IKVKey {

            /**
             * Constructs a new KVKey.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IKVKey);

            /** KVKey path. */
            public path: string;

            /** KVKey key. */
            public key: Uint8Array;

            /**
             * Encodes the specified KVKey message. Does not implicitly {@link neutron.interchainqueries.KVKey.verify|verify} messages.
             * @param message KVKey message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IKVKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified KVKey message, length delimited. Does not implicitly {@link neutron.interchainqueries.KVKey.verify|verify} messages.
             * @param message KVKey message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IKVKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a KVKey message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns KVKey
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.KVKey;

            /**
             * Decodes a KVKey message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns KVKey
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.KVKey;

            /**
             * Verifies a KVKey message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a KVKey message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns KVKey
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.KVKey;

            /**
             * Creates a plain object from a KVKey message. Also converts values to other types if specified.
             * @param message KVKey
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.KVKey, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this KVKey to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GenesisState. */
        interface IGenesisState {

            /** GenesisState params */
            params?: (neutron.interchainqueries.IParams|null);

            /** GenesisState registered_queries */
            registered_queries?: (neutron.interchainqueries.IRegisteredQuery[]|null);
        }

        /** Represents a GenesisState. */
        class GenesisState implements IGenesisState {

            /**
             * Constructs a new GenesisState.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IGenesisState);

            /** GenesisState params. */
            public params?: (neutron.interchainqueries.IParams|null);

            /** GenesisState registered_queries. */
            public registered_queries: neutron.interchainqueries.IRegisteredQuery[];

            /**
             * Encodes the specified GenesisState message. Does not implicitly {@link neutron.interchainqueries.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link neutron.interchainqueries.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GenesisState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.GenesisState;

            /**
             * Decodes a GenesisState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.GenesisState;

            /**
             * Verifies a GenesisState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenesisState
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.GenesisState;

            /**
             * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
             * @param message GenesisState
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GenesisState to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Params. */
        interface IParams {

            /** Params query_submit_timeout */
            query_submit_timeout?: (Long|null);

            /** Params query_deposit */
            query_deposit?: (cosmos.base.v1beta1.ICoin[]|null);
        }

        /** Represents a Params. */
        class Params implements IParams {

            /**
             * Constructs a new Params.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IParams);

            /** Params query_submit_timeout. */
            public query_submit_timeout: Long;

            /** Params query_deposit. */
            public query_deposit: cosmos.base.v1beta1.ICoin[];

            /**
             * Encodes the specified Params message. Does not implicitly {@link neutron.interchainqueries.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Params message, length delimited. Does not implicitly {@link neutron.interchainqueries.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Params message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.Params;

            /**
             * Decodes a Params message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.Params;

            /**
             * Verifies a Params message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Params message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Params
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.Params;

            /**
             * Creates a plain object from a Params message. Also converts values to other types if specified.
             * @param message Params
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Params to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: neutron.interchainqueries.IQueryParamsRequest, callback: neutron.interchainqueries.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: neutron.interchainqueries.IQueryParamsRequest): Promise<neutron.interchainqueries.QueryParamsResponse>;

            /**
             * Calls RegisteredQueries.
             * @param request QueryRegisteredQueriesRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryRegisteredQueriesResponse
             */
            public registeredQueries(request: neutron.interchainqueries.IQueryRegisteredQueriesRequest, callback: neutron.interchainqueries.Query.RegisteredQueriesCallback): void;

            /**
             * Calls RegisteredQueries.
             * @param request QueryRegisteredQueriesRequest message or plain object
             * @returns Promise
             */
            public registeredQueries(request: neutron.interchainqueries.IQueryRegisteredQueriesRequest): Promise<neutron.interchainqueries.QueryRegisteredQueriesResponse>;

            /**
             * Calls RegisteredQuery.
             * @param request QueryRegisteredQueryRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryRegisteredQueryResponse
             */
            public registeredQuery(request: neutron.interchainqueries.IQueryRegisteredQueryRequest, callback: neutron.interchainqueries.Query.RegisteredQueryCallback): void;

            /**
             * Calls RegisteredQuery.
             * @param request QueryRegisteredQueryRequest message or plain object
             * @returns Promise
             */
            public registeredQuery(request: neutron.interchainqueries.IQueryRegisteredQueryRequest): Promise<neutron.interchainqueries.QueryRegisteredQueryResponse>;

            /**
             * Calls QueryResult.
             * @param request QueryRegisteredQueryResultRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryRegisteredQueryResultResponse
             */
            public queryResult(request: neutron.interchainqueries.IQueryRegisteredQueryResultRequest, callback: neutron.interchainqueries.Query.QueryResultCallback): void;

            /**
             * Calls QueryResult.
             * @param request QueryRegisteredQueryResultRequest message or plain object
             * @returns Promise
             */
            public queryResult(request: neutron.interchainqueries.IQueryRegisteredQueryResultRequest): Promise<neutron.interchainqueries.QueryRegisteredQueryResultResponse>;

            /**
             * Calls LastRemoteHeight.
             * @param request QueryLastRemoteHeight message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryLastRemoteHeightResponse
             */
            public lastRemoteHeight(request: neutron.interchainqueries.IQueryLastRemoteHeight, callback: neutron.interchainqueries.Query.LastRemoteHeightCallback): void;

            /**
             * Calls LastRemoteHeight.
             * @param request QueryLastRemoteHeight message or plain object
             * @returns Promise
             */
            public lastRemoteHeight(request: neutron.interchainqueries.IQueryLastRemoteHeight): Promise<neutron.interchainqueries.QueryLastRemoteHeightResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.interchainqueries.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: neutron.interchainqueries.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Query#registeredQueries}.
             * @param error Error, if any
             * @param [response] QueryRegisteredQueriesResponse
             */
            type RegisteredQueriesCallback = (error: (Error|null), response?: neutron.interchainqueries.QueryRegisteredQueriesResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Query#registeredQuery}.
             * @param error Error, if any
             * @param [response] QueryRegisteredQueryResponse
             */
            type RegisteredQueryCallback = (error: (Error|null), response?: neutron.interchainqueries.QueryRegisteredQueryResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Query#queryResult}.
             * @param error Error, if any
             * @param [response] QueryRegisteredQueryResultResponse
             */
            type QueryResultCallback = (error: (Error|null), response?: neutron.interchainqueries.QueryRegisteredQueryResultResponse) => void;

            /**
             * Callback as used by {@link neutron.interchainqueries.Query#lastRemoteHeight}.
             * @param error Error, if any
             * @param [response] QueryLastRemoteHeightResponse
             */
            type LastRemoteHeightCallback = (error: (Error|null), response?: neutron.interchainqueries.QueryLastRemoteHeightResponse) => void;
        }

        /** Properties of a QueryParamsRequest. */
        interface IQueryParamsRequest {
        }

        /** Represents a QueryParamsRequest. */
        class QueryParamsRequest implements IQueryParamsRequest {

            /**
             * Constructs a new QueryParamsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryParamsRequest);

            /**
             * Encodes the specified QueryParamsRequest message. Does not implicitly {@link neutron.interchainqueries.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryParamsRequest;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryParamsRequest;

            /**
             * Verifies a QueryParamsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryParamsRequest;

            /**
             * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
             * @param message QueryParamsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryParamsResponse. */
        interface IQueryParamsResponse {

            /** QueryParamsResponse params */
            params?: (neutron.interchainqueries.IParams|null);
        }

        /** Represents a QueryParamsResponse. */
        class QueryParamsResponse implements IQueryParamsResponse {

            /**
             * Constructs a new QueryParamsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryParamsResponse);

            /** QueryParamsResponse params. */
            public params?: (neutron.interchainqueries.IParams|null);

            /**
             * Encodes the specified QueryParamsResponse message. Does not implicitly {@link neutron.interchainqueries.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryParamsResponse;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryParamsResponse;

            /**
             * Verifies a QueryParamsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryParamsResponse;

            /**
             * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
             * @param message QueryParamsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueriesRequest. */
        interface IQueryRegisteredQueriesRequest {

            /** QueryRegisteredQueriesRequest owners */
            owners?: (string[]|null);

            /** QueryRegisteredQueriesRequest connection_id */
            connection_id?: (string|null);

            /** QueryRegisteredQueriesRequest pagination */
            pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);
        }

        /** Represents a QueryRegisteredQueriesRequest. */
        class QueryRegisteredQueriesRequest implements IQueryRegisteredQueriesRequest {

            /**
             * Constructs a new QueryRegisteredQueriesRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueriesRequest);

            /** QueryRegisteredQueriesRequest owners. */
            public owners: string[];

            /** QueryRegisteredQueriesRequest connection_id. */
            public connection_id: string;

            /** QueryRegisteredQueriesRequest pagination. */
            public pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);

            /**
             * Encodes the specified QueryRegisteredQueriesRequest message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueriesRequest.verify|verify} messages.
             * @param message QueryRegisteredQueriesRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueriesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueriesRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueriesRequest.verify|verify} messages.
             * @param message QueryRegisteredQueriesRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueriesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueriesRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueriesRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueriesRequest;

            /**
             * Decodes a QueryRegisteredQueriesRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueriesRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueriesRequest;

            /**
             * Verifies a QueryRegisteredQueriesRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueriesRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueriesRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueriesRequest;

            /**
             * Creates a plain object from a QueryRegisteredQueriesRequest message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueriesRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueriesRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueriesRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueriesResponse. */
        interface IQueryRegisteredQueriesResponse {

            /** QueryRegisteredQueriesResponse registered_queries */
            registered_queries?: (neutron.interchainqueries.IRegisteredQuery[]|null);

            /** QueryRegisteredQueriesResponse pagination */
            pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);
        }

        /** Represents a QueryRegisteredQueriesResponse. */
        class QueryRegisteredQueriesResponse implements IQueryRegisteredQueriesResponse {

            /**
             * Constructs a new QueryRegisteredQueriesResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueriesResponse);

            /** QueryRegisteredQueriesResponse registered_queries. */
            public registered_queries: neutron.interchainqueries.IRegisteredQuery[];

            /** QueryRegisteredQueriesResponse pagination. */
            public pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);

            /**
             * Encodes the specified QueryRegisteredQueriesResponse message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueriesResponse.verify|verify} messages.
             * @param message QueryRegisteredQueriesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueriesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueriesResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueriesResponse.verify|verify} messages.
             * @param message QueryRegisteredQueriesResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueriesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueriesResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueriesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueriesResponse;

            /**
             * Decodes a QueryRegisteredQueriesResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueriesResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueriesResponse;

            /**
             * Verifies a QueryRegisteredQueriesResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueriesResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueriesResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueriesResponse;

            /**
             * Creates a plain object from a QueryRegisteredQueriesResponse message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueriesResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueriesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueriesResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueryRequest. */
        interface IQueryRegisteredQueryRequest {

            /** QueryRegisteredQueryRequest query_id */
            query_id?: (Long|null);
        }

        /** Represents a QueryRegisteredQueryRequest. */
        class QueryRegisteredQueryRequest implements IQueryRegisteredQueryRequest {

            /**
             * Constructs a new QueryRegisteredQueryRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueryRequest);

            /** QueryRegisteredQueryRequest query_id. */
            public query_id: Long;

            /**
             * Encodes the specified QueryRegisteredQueryRequest message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryRequest.verify|verify} messages.
             * @param message QueryRegisteredQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueryRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryRequest.verify|verify} messages.
             * @param message QueryRegisteredQueryRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueryRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueryRequest;

            /**
             * Decodes a QueryRegisteredQueryRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueryRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueryRequest;

            /**
             * Verifies a QueryRegisteredQueryRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueryRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueryRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueryRequest;

            /**
             * Creates a plain object from a QueryRegisteredQueryRequest message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueryRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueryRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueryResponse. */
        interface IQueryRegisteredQueryResponse {

            /** QueryRegisteredQueryResponse registered_query */
            registered_query?: (neutron.interchainqueries.IRegisteredQuery|null);
        }

        /** Represents a QueryRegisteredQueryResponse. */
        class QueryRegisteredQueryResponse implements IQueryRegisteredQueryResponse {

            /**
             * Constructs a new QueryRegisteredQueryResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueryResponse);

            /** QueryRegisteredQueryResponse registered_query. */
            public registered_query?: (neutron.interchainqueries.IRegisteredQuery|null);

            /**
             * Encodes the specified QueryRegisteredQueryResponse message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResponse.verify|verify} messages.
             * @param message QueryRegisteredQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueryResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResponse.verify|verify} messages.
             * @param message QueryRegisteredQueryResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueryResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueryResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueryResponse;

            /**
             * Decodes a QueryRegisteredQueryResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueryResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueryResponse;

            /**
             * Verifies a QueryRegisteredQueryResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueryResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueryResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueryResponse;

            /**
             * Creates a plain object from a QueryRegisteredQueryResponse message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueryResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueryResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueryResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueryResultRequest. */
        interface IQueryRegisteredQueryResultRequest {

            /** QueryRegisteredQueryResultRequest query_id */
            query_id?: (Long|null);
        }

        /** Represents a QueryRegisteredQueryResultRequest. */
        class QueryRegisteredQueryResultRequest implements IQueryRegisteredQueryResultRequest {

            /**
             * Constructs a new QueryRegisteredQueryResultRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueryResultRequest);

            /** QueryRegisteredQueryResultRequest query_id. */
            public query_id: Long;

            /**
             * Encodes the specified QueryRegisteredQueryResultRequest message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResultRequest.verify|verify} messages.
             * @param message QueryRegisteredQueryResultRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueryResultRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueryResultRequest message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResultRequest.verify|verify} messages.
             * @param message QueryRegisteredQueryResultRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueryResultRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueryResultRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueryResultRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueryResultRequest;

            /**
             * Decodes a QueryRegisteredQueryResultRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueryResultRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueryResultRequest;

            /**
             * Verifies a QueryRegisteredQueryResultRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueryResultRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueryResultRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueryResultRequest;

            /**
             * Creates a plain object from a QueryRegisteredQueryResultRequest message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueryResultRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueryResultRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueryResultRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryRegisteredQueryResultResponse. */
        interface IQueryRegisteredQueryResultResponse {

            /** QueryRegisteredQueryResultResponse result */
            result?: (neutron.interchainqueries.IQueryResult|null);
        }

        /** Represents a QueryRegisteredQueryResultResponse. */
        class QueryRegisteredQueryResultResponse implements IQueryRegisteredQueryResultResponse {

            /**
             * Constructs a new QueryRegisteredQueryResultResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryRegisteredQueryResultResponse);

            /** QueryRegisteredQueryResultResponse result. */
            public result?: (neutron.interchainqueries.IQueryResult|null);

            /**
             * Encodes the specified QueryRegisteredQueryResultResponse message. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResultResponse.verify|verify} messages.
             * @param message QueryRegisteredQueryResultResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryRegisteredQueryResultResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryRegisteredQueryResultResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryRegisteredQueryResultResponse.verify|verify} messages.
             * @param message QueryRegisteredQueryResultResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryRegisteredQueryResultResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryRegisteredQueryResultResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryRegisteredQueryResultResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryRegisteredQueryResultResponse;

            /**
             * Decodes a QueryRegisteredQueryResultResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryRegisteredQueryResultResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryRegisteredQueryResultResponse;

            /**
             * Verifies a QueryRegisteredQueryResultResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryRegisteredQueryResultResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryRegisteredQueryResultResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryRegisteredQueryResultResponse;

            /**
             * Creates a plain object from a QueryRegisteredQueryResultResponse message. Also converts values to other types if specified.
             * @param message QueryRegisteredQueryResultResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryRegisteredQueryResultResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryRegisteredQueryResultResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Transaction. */
        interface ITransaction {

            /** Transaction id */
            id?: (Long|null);

            /** Transaction height */
            height?: (Long|null);

            /** Transaction data */
            data?: (Uint8Array|null);
        }

        /** Represents a Transaction. */
        class Transaction implements ITransaction {

            /**
             * Constructs a new Transaction.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.ITransaction);

            /** Transaction id. */
            public id: Long;

            /** Transaction height. */
            public height: Long;

            /** Transaction data. */
            public data: Uint8Array;

            /**
             * Encodes the specified Transaction message. Does not implicitly {@link neutron.interchainqueries.Transaction.verify|verify} messages.
             * @param message Transaction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Transaction message, length delimited. Does not implicitly {@link neutron.interchainqueries.Transaction.verify|verify} messages.
             * @param message Transaction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Transaction message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Transaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.Transaction;

            /**
             * Decodes a Transaction message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Transaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.Transaction;

            /**
             * Verifies a Transaction message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Transaction
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.Transaction;

            /**
             * Creates a plain object from a Transaction message. Also converts values to other types if specified.
             * @param message Transaction
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.Transaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Transaction to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryLastRemoteHeight. */
        interface IQueryLastRemoteHeight {

            /** QueryLastRemoteHeight connection_id */
            connection_id?: (string|null);
        }

        /** Represents a QueryLastRemoteHeight. */
        class QueryLastRemoteHeight implements IQueryLastRemoteHeight {

            /**
             * Constructs a new QueryLastRemoteHeight.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryLastRemoteHeight);

            /** QueryLastRemoteHeight connection_id. */
            public connection_id: string;

            /**
             * Encodes the specified QueryLastRemoteHeight message. Does not implicitly {@link neutron.interchainqueries.QueryLastRemoteHeight.verify|verify} messages.
             * @param message QueryLastRemoteHeight message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryLastRemoteHeight, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryLastRemoteHeight message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryLastRemoteHeight.verify|verify} messages.
             * @param message QueryLastRemoteHeight message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryLastRemoteHeight, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryLastRemoteHeight message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryLastRemoteHeight
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryLastRemoteHeight;

            /**
             * Decodes a QueryLastRemoteHeight message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryLastRemoteHeight
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryLastRemoteHeight;

            /**
             * Verifies a QueryLastRemoteHeight message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryLastRemoteHeight message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryLastRemoteHeight
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryLastRemoteHeight;

            /**
             * Creates a plain object from a QueryLastRemoteHeight message. Also converts values to other types if specified.
             * @param message QueryLastRemoteHeight
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryLastRemoteHeight, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryLastRemoteHeight to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryLastRemoteHeightResponse. */
        interface IQueryLastRemoteHeightResponse {

            /** QueryLastRemoteHeightResponse height */
            height?: (Long|null);
        }

        /** Represents a QueryLastRemoteHeightResponse. */
        class QueryLastRemoteHeightResponse implements IQueryLastRemoteHeightResponse {

            /**
             * Constructs a new QueryLastRemoteHeightResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchainqueries.IQueryLastRemoteHeightResponse);

            /** QueryLastRemoteHeightResponse height. */
            public height: Long;

            /**
             * Encodes the specified QueryLastRemoteHeightResponse message. Does not implicitly {@link neutron.interchainqueries.QueryLastRemoteHeightResponse.verify|verify} messages.
             * @param message QueryLastRemoteHeightResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchainqueries.IQueryLastRemoteHeightResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryLastRemoteHeightResponse message, length delimited. Does not implicitly {@link neutron.interchainqueries.QueryLastRemoteHeightResponse.verify|verify} messages.
             * @param message QueryLastRemoteHeightResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchainqueries.IQueryLastRemoteHeightResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryLastRemoteHeightResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryLastRemoteHeightResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchainqueries.QueryLastRemoteHeightResponse;

            /**
             * Decodes a QueryLastRemoteHeightResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryLastRemoteHeightResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchainqueries.QueryLastRemoteHeightResponse;

            /**
             * Verifies a QueryLastRemoteHeightResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryLastRemoteHeightResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryLastRemoteHeightResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchainqueries.QueryLastRemoteHeightResponse;

            /**
             * Creates a plain object from a QueryLastRemoteHeightResponse message. Also converts values to other types if specified.
             * @param message QueryLastRemoteHeightResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchainqueries.QueryLastRemoteHeightResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryLastRemoteHeightResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace interchaintxs. */
    namespace interchaintxs {

        /** Namespace v1. */
        namespace v1 {

            /** Represents a Msg */
            class Msg extends $protobuf.rpc.Service {

                /**
                 * Constructs a new Msg service.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 */
                constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                /**
                 * Calls RegisterInterchainAccount.
                 * @param request MsgRegisterInterchainAccount message or plain object
                 * @param callback Node-style callback called with the error, if any, and MsgRegisterInterchainAccountResponse
                 */
                public registerInterchainAccount(request: neutron.interchaintxs.v1.IMsgRegisterInterchainAccount, callback: neutron.interchaintxs.v1.Msg.RegisterInterchainAccountCallback): void;

                /**
                 * Calls RegisterInterchainAccount.
                 * @param request MsgRegisterInterchainAccount message or plain object
                 * @returns Promise
                 */
                public registerInterchainAccount(request: neutron.interchaintxs.v1.IMsgRegisterInterchainAccount): Promise<neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse>;

                /**
                 * Calls SubmitTx.
                 * @param request MsgSubmitTx message or plain object
                 * @param callback Node-style callback called with the error, if any, and MsgSubmitTxResponse
                 */
                public submitTx(request: neutron.interchaintxs.v1.IMsgSubmitTx, callback: neutron.interchaintxs.v1.Msg.SubmitTxCallback): void;

                /**
                 * Calls SubmitTx.
                 * @param request MsgSubmitTx message or plain object
                 * @returns Promise
                 */
                public submitTx(request: neutron.interchaintxs.v1.IMsgSubmitTx): Promise<neutron.interchaintxs.v1.MsgSubmitTxResponse>;
            }

            namespace Msg {

                /**
                 * Callback as used by {@link neutron.interchaintxs.v1.Msg#registerInterchainAccount}.
                 * @param error Error, if any
                 * @param [response] MsgRegisterInterchainAccountResponse
                 */
                type RegisterInterchainAccountCallback = (error: (Error|null), response?: neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse) => void;

                /**
                 * Callback as used by {@link neutron.interchaintxs.v1.Msg#submitTx}.
                 * @param error Error, if any
                 * @param [response] MsgSubmitTxResponse
                 */
                type SubmitTxCallback = (error: (Error|null), response?: neutron.interchaintxs.v1.MsgSubmitTxResponse) => void;
            }

            /** Properties of a MsgRegisterInterchainAccount. */
            interface IMsgRegisterInterchainAccount {

                /** MsgRegisterInterchainAccount from_address */
                from_address?: (string|null);

                /** MsgRegisterInterchainAccount connection_id */
                connection_id?: (string|null);

                /** MsgRegisterInterchainAccount interchain_account_id */
                interchain_account_id?: (string|null);
            }

            /** Represents a MsgRegisterInterchainAccount. */
            class MsgRegisterInterchainAccount implements IMsgRegisterInterchainAccount {

                /**
                 * Constructs a new MsgRegisterInterchainAccount.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: neutron.interchaintxs.v1.IMsgRegisterInterchainAccount);

                /** MsgRegisterInterchainAccount from_address. */
                public from_address: string;

                /** MsgRegisterInterchainAccount connection_id. */
                public connection_id: string;

                /** MsgRegisterInterchainAccount interchain_account_id. */
                public interchain_account_id: string;

                /**
                 * Encodes the specified MsgRegisterInterchainAccount message. Does not implicitly {@link neutron.interchaintxs.v1.MsgRegisterInterchainAccount.verify|verify} messages.
                 * @param message MsgRegisterInterchainAccount message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: neutron.interchaintxs.v1.IMsgRegisterInterchainAccount, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgRegisterInterchainAccount message, length delimited. Does not implicitly {@link neutron.interchaintxs.v1.MsgRegisterInterchainAccount.verify|verify} messages.
                 * @param message MsgRegisterInterchainAccount message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: neutron.interchaintxs.v1.IMsgRegisterInterchainAccount, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgRegisterInterchainAccount message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgRegisterInterchainAccount
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.v1.MsgRegisterInterchainAccount;

                /**
                 * Decodes a MsgRegisterInterchainAccount message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgRegisterInterchainAccount
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.v1.MsgRegisterInterchainAccount;

                /**
                 * Verifies a MsgRegisterInterchainAccount message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgRegisterInterchainAccount message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgRegisterInterchainAccount
                 */
                public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.v1.MsgRegisterInterchainAccount;

                /**
                 * Creates a plain object from a MsgRegisterInterchainAccount message. Also converts values to other types if specified.
                 * @param message MsgRegisterInterchainAccount
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: neutron.interchaintxs.v1.MsgRegisterInterchainAccount, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgRegisterInterchainAccount to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgRegisterInterchainAccountResponse. */
            interface IMsgRegisterInterchainAccountResponse {
            }

            /** Represents a MsgRegisterInterchainAccountResponse. */
            class MsgRegisterInterchainAccountResponse implements IMsgRegisterInterchainAccountResponse {

                /**
                 * Constructs a new MsgRegisterInterchainAccountResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: neutron.interchaintxs.v1.IMsgRegisterInterchainAccountResponse);

                /**
                 * Encodes the specified MsgRegisterInterchainAccountResponse message. Does not implicitly {@link neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse.verify|verify} messages.
                 * @param message MsgRegisterInterchainAccountResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: neutron.interchaintxs.v1.IMsgRegisterInterchainAccountResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgRegisterInterchainAccountResponse message, length delimited. Does not implicitly {@link neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse.verify|verify} messages.
                 * @param message MsgRegisterInterchainAccountResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: neutron.interchaintxs.v1.IMsgRegisterInterchainAccountResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgRegisterInterchainAccountResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgRegisterInterchainAccountResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse;

                /**
                 * Decodes a MsgRegisterInterchainAccountResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgRegisterInterchainAccountResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse;

                /**
                 * Verifies a MsgRegisterInterchainAccountResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgRegisterInterchainAccountResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgRegisterInterchainAccountResponse
                 */
                public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse;

                /**
                 * Creates a plain object from a MsgRegisterInterchainAccountResponse message. Also converts values to other types if specified.
                 * @param message MsgRegisterInterchainAccountResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: neutron.interchaintxs.v1.MsgRegisterInterchainAccountResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgRegisterInterchainAccountResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgSubmitTx. */
            interface IMsgSubmitTx {

                /** MsgSubmitTx from_address */
                from_address?: (string|null);

                /** MsgSubmitTx interchain_account_id */
                interchain_account_id?: (string|null);

                /** MsgSubmitTx connection_id */
                connection_id?: (string|null);

                /** MsgSubmitTx msgs */
                msgs?: (google.protobuf.IAny[]|null);

                /** MsgSubmitTx memo */
                memo?: (string|null);

                /** MsgSubmitTx timeout */
                timeout?: (Long|null);

                /** MsgSubmitTx fee */
                fee?: (neutron.feerefunder.IFee|null);
            }

            /** Represents a MsgSubmitTx. */
            class MsgSubmitTx implements IMsgSubmitTx {

                /**
                 * Constructs a new MsgSubmitTx.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: neutron.interchaintxs.v1.IMsgSubmitTx);

                /** MsgSubmitTx from_address. */
                public from_address: string;

                /** MsgSubmitTx interchain_account_id. */
                public interchain_account_id: string;

                /** MsgSubmitTx connection_id. */
                public connection_id: string;

                /** MsgSubmitTx msgs. */
                public msgs: google.protobuf.IAny[];

                /** MsgSubmitTx memo. */
                public memo: string;

                /** MsgSubmitTx timeout. */
                public timeout: Long;

                /** MsgSubmitTx fee. */
                public fee?: (neutron.feerefunder.IFee|null);

                /**
                 * Encodes the specified MsgSubmitTx message. Does not implicitly {@link neutron.interchaintxs.v1.MsgSubmitTx.verify|verify} messages.
                 * @param message MsgSubmitTx message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: neutron.interchaintxs.v1.IMsgSubmitTx, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgSubmitTx message, length delimited. Does not implicitly {@link neutron.interchaintxs.v1.MsgSubmitTx.verify|verify} messages.
                 * @param message MsgSubmitTx message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: neutron.interchaintxs.v1.IMsgSubmitTx, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgSubmitTx message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgSubmitTx
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.v1.MsgSubmitTx;

                /**
                 * Decodes a MsgSubmitTx message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgSubmitTx
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.v1.MsgSubmitTx;

                /**
                 * Verifies a MsgSubmitTx message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgSubmitTx message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgSubmitTx
                 */
                public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.v1.MsgSubmitTx;

                /**
                 * Creates a plain object from a MsgSubmitTx message. Also converts values to other types if specified.
                 * @param message MsgSubmitTx
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: neutron.interchaintxs.v1.MsgSubmitTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgSubmitTx to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgSubmitTxResponse. */
            interface IMsgSubmitTxResponse {

                /** MsgSubmitTxResponse sequence_id */
                sequence_id?: (Long|null);

                /** MsgSubmitTxResponse channel */
                channel?: (string|null);
            }

            /** Represents a MsgSubmitTxResponse. */
            class MsgSubmitTxResponse implements IMsgSubmitTxResponse {

                /**
                 * Constructs a new MsgSubmitTxResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: neutron.interchaintxs.v1.IMsgSubmitTxResponse);

                /** MsgSubmitTxResponse sequence_id. */
                public sequence_id: Long;

                /** MsgSubmitTxResponse channel. */
                public channel: string;

                /**
                 * Encodes the specified MsgSubmitTxResponse message. Does not implicitly {@link neutron.interchaintxs.v1.MsgSubmitTxResponse.verify|verify} messages.
                 * @param message MsgSubmitTxResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: neutron.interchaintxs.v1.IMsgSubmitTxResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgSubmitTxResponse message, length delimited. Does not implicitly {@link neutron.interchaintxs.v1.MsgSubmitTxResponse.verify|verify} messages.
                 * @param message MsgSubmitTxResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: neutron.interchaintxs.v1.IMsgSubmitTxResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgSubmitTxResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgSubmitTxResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.v1.MsgSubmitTxResponse;

                /**
                 * Decodes a MsgSubmitTxResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgSubmitTxResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.v1.MsgSubmitTxResponse;

                /**
                 * Verifies a MsgSubmitTxResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgSubmitTxResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgSubmitTxResponse
                 */
                public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.v1.MsgSubmitTxResponse;

                /**
                 * Creates a plain object from a MsgSubmitTxResponse message. Also converts values to other types if specified.
                 * @param message MsgSubmitTxResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: neutron.interchaintxs.v1.MsgSubmitTxResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgSubmitTxResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: neutron.interchaintxs.IQueryParamsRequest, callback: neutron.interchaintxs.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: neutron.interchaintxs.IQueryParamsRequest): Promise<neutron.interchaintxs.QueryParamsResponse>;

            /**
             * Calls InterchainAccountAddress.
             * @param request QueryInterchainAccountAddressRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryInterchainAccountAddressResponse
             */
            public interchainAccountAddress(request: neutron.interchaintxs.IQueryInterchainAccountAddressRequest, callback: neutron.interchaintxs.Query.InterchainAccountAddressCallback): void;

            /**
             * Calls InterchainAccountAddress.
             * @param request QueryInterchainAccountAddressRequest message or plain object
             * @returns Promise
             */
            public interchainAccountAddress(request: neutron.interchaintxs.IQueryInterchainAccountAddressRequest): Promise<neutron.interchaintxs.QueryInterchainAccountAddressResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.interchaintxs.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: neutron.interchaintxs.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.interchaintxs.Query#interchainAccountAddress}.
             * @param error Error, if any
             * @param [response] QueryInterchainAccountAddressResponse
             */
            type InterchainAccountAddressCallback = (error: (Error|null), response?: neutron.interchaintxs.QueryInterchainAccountAddressResponse) => void;
        }

        /** Properties of a QueryParamsRequest. */
        interface IQueryParamsRequest {
        }

        /** Represents a QueryParamsRequest. */
        class QueryParamsRequest implements IQueryParamsRequest {

            /**
             * Constructs a new QueryParamsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IQueryParamsRequest);

            /**
             * Encodes the specified QueryParamsRequest message. Does not implicitly {@link neutron.interchaintxs.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link neutron.interchaintxs.QueryParamsRequest.verify|verify} messages.
             * @param message QueryParamsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.QueryParamsRequest;

            /**
             * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.QueryParamsRequest;

            /**
             * Verifies a QueryParamsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.QueryParamsRequest;

            /**
             * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
             * @param message QueryParamsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryParamsResponse. */
        interface IQueryParamsResponse {

            /** QueryParamsResponse params */
            params?: (neutron.interchaintxs.IParams|null);
        }

        /** Represents a QueryParamsResponse. */
        class QueryParamsResponse implements IQueryParamsResponse {

            /**
             * Constructs a new QueryParamsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IQueryParamsResponse);

            /** QueryParamsResponse params. */
            public params?: (neutron.interchaintxs.IParams|null);

            /**
             * Encodes the specified QueryParamsResponse message. Does not implicitly {@link neutron.interchaintxs.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link neutron.interchaintxs.QueryParamsResponse.verify|verify} messages.
             * @param message QueryParamsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.QueryParamsResponse;

            /**
             * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryParamsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.QueryParamsResponse;

            /**
             * Verifies a QueryParamsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryParamsResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.QueryParamsResponse;

            /**
             * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
             * @param message QueryParamsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryParamsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryInterchainAccountAddressRequest. */
        interface IQueryInterchainAccountAddressRequest {

            /** QueryInterchainAccountAddressRequest owner_address */
            owner_address?: (string|null);

            /** QueryInterchainAccountAddressRequest interchain_account_id */
            interchain_account_id?: (string|null);

            /** QueryInterchainAccountAddressRequest connection_id */
            connection_id?: (string|null);
        }

        /** Represents a QueryInterchainAccountAddressRequest. */
        class QueryInterchainAccountAddressRequest implements IQueryInterchainAccountAddressRequest {

            /**
             * Constructs a new QueryInterchainAccountAddressRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IQueryInterchainAccountAddressRequest);

            /** QueryInterchainAccountAddressRequest owner_address. */
            public owner_address: string;

            /** QueryInterchainAccountAddressRequest interchain_account_id. */
            public interchain_account_id: string;

            /** QueryInterchainAccountAddressRequest connection_id. */
            public connection_id: string;

            /**
             * Encodes the specified QueryInterchainAccountAddressRequest message. Does not implicitly {@link neutron.interchaintxs.QueryInterchainAccountAddressRequest.verify|verify} messages.
             * @param message QueryInterchainAccountAddressRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IQueryInterchainAccountAddressRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryInterchainAccountAddressRequest message, length delimited. Does not implicitly {@link neutron.interchaintxs.QueryInterchainAccountAddressRequest.verify|verify} messages.
             * @param message QueryInterchainAccountAddressRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IQueryInterchainAccountAddressRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryInterchainAccountAddressRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryInterchainAccountAddressRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.QueryInterchainAccountAddressRequest;

            /**
             * Decodes a QueryInterchainAccountAddressRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryInterchainAccountAddressRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.QueryInterchainAccountAddressRequest;

            /**
             * Verifies a QueryInterchainAccountAddressRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryInterchainAccountAddressRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryInterchainAccountAddressRequest
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.QueryInterchainAccountAddressRequest;

            /**
             * Creates a plain object from a QueryInterchainAccountAddressRequest message. Also converts values to other types if specified.
             * @param message QueryInterchainAccountAddressRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.QueryInterchainAccountAddressRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryInterchainAccountAddressRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QueryInterchainAccountAddressResponse. */
        interface IQueryInterchainAccountAddressResponse {

            /** QueryInterchainAccountAddressResponse interchain_account_address */
            interchain_account_address?: (string|null);
        }

        /** Represents a QueryInterchainAccountAddressResponse. */
        class QueryInterchainAccountAddressResponse implements IQueryInterchainAccountAddressResponse {

            /**
             * Constructs a new QueryInterchainAccountAddressResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IQueryInterchainAccountAddressResponse);

            /** QueryInterchainAccountAddressResponse interchain_account_address. */
            public interchain_account_address: string;

            /**
             * Encodes the specified QueryInterchainAccountAddressResponse message. Does not implicitly {@link neutron.interchaintxs.QueryInterchainAccountAddressResponse.verify|verify} messages.
             * @param message QueryInterchainAccountAddressResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IQueryInterchainAccountAddressResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QueryInterchainAccountAddressResponse message, length delimited. Does not implicitly {@link neutron.interchaintxs.QueryInterchainAccountAddressResponse.verify|verify} messages.
             * @param message QueryInterchainAccountAddressResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IQueryInterchainAccountAddressResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QueryInterchainAccountAddressResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QueryInterchainAccountAddressResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.QueryInterchainAccountAddressResponse;

            /**
             * Decodes a QueryInterchainAccountAddressResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QueryInterchainAccountAddressResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.QueryInterchainAccountAddressResponse;

            /**
             * Verifies a QueryInterchainAccountAddressResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QueryInterchainAccountAddressResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QueryInterchainAccountAddressResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.QueryInterchainAccountAddressResponse;

            /**
             * Creates a plain object from a QueryInterchainAccountAddressResponse message. Also converts values to other types if specified.
             * @param message QueryInterchainAccountAddressResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.QueryInterchainAccountAddressResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QueryInterchainAccountAddressResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Params. */
        interface IParams {

            /** Params msg_submit_tx_max_messages */
            msg_submit_tx_max_messages?: (Long|null);
        }

        /** Represents a Params. */
        class Params implements IParams {

            /**
             * Constructs a new Params.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IParams);

            /** Params msg_submit_tx_max_messages. */
            public msg_submit_tx_max_messages: Long;

            /**
             * Encodes the specified Params message. Does not implicitly {@link neutron.interchaintxs.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Params message, length delimited. Does not implicitly {@link neutron.interchaintxs.Params.verify|verify} messages.
             * @param message Params message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Params message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.Params;

            /**
             * Decodes a Params message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Params
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.Params;

            /**
             * Verifies a Params message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Params message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Params
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.Params;

            /**
             * Creates a plain object from a Params message. Also converts values to other types if specified.
             * @param message Params
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Params to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GenesisState. */
        interface IGenesisState {

            /** GenesisState params */
            params?: (neutron.interchaintxs.IParams|null);
        }

        /** Represents a GenesisState. */
        class GenesisState implements IGenesisState {

            /**
             * Constructs a new GenesisState.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.interchaintxs.IGenesisState);

            /** GenesisState params. */
            public params?: (neutron.interchaintxs.IParams|null);

            /**
             * Encodes the specified GenesisState message. Does not implicitly {@link neutron.interchaintxs.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.interchaintxs.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link neutron.interchaintxs.GenesisState.verify|verify} messages.
             * @param message GenesisState message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.interchaintxs.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GenesisState message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.interchaintxs.GenesisState;

            /**
             * Decodes a GenesisState message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenesisState
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.interchaintxs.GenesisState;

            /**
             * Verifies a GenesisState message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenesisState
             */
            public static fromObject(object: { [k: string]: any }): neutron.interchaintxs.GenesisState;

            /**
             * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
             * @param message GenesisState
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.interchaintxs.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GenesisState to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace transfer. */
    namespace transfer {

        /** Represents a Msg */
        class Msg extends $protobuf.rpc.Service {

            /**
             * Constructs a new Msg service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Transfer.
             * @param request MsgTransfer message or plain object
             * @param callback Node-style callback called with the error, if any, and MsgTransferResponse
             */
            public transfer(request: neutron.transfer.IMsgTransfer, callback: neutron.transfer.Msg.TransferCallback): void;

            /**
             * Calls Transfer.
             * @param request MsgTransfer message or plain object
             * @returns Promise
             */
            public transfer(request: neutron.transfer.IMsgTransfer): Promise<neutron.transfer.MsgTransferResponse>;
        }

        namespace Msg {

            /**
             * Callback as used by {@link neutron.transfer.Msg#transfer}.
             * @param error Error, if any
             * @param [response] MsgTransferResponse
             */
            type TransferCallback = (error: (Error|null), response?: neutron.transfer.MsgTransferResponse) => void;
        }

        /** Properties of a MsgTransfer. */
        interface IMsgTransfer {

            /** MsgTransfer source_port */
            source_port?: (string|null);

            /** MsgTransfer source_channel */
            source_channel?: (string|null);

            /** MsgTransfer token */
            token?: (cosmos.base.v1beta1.ICoin|null);

            /** MsgTransfer sender */
            sender?: (string|null);

            /** MsgTransfer receiver */
            receiver?: (string|null);

            /** MsgTransfer timeout_height */
            timeout_height?: (ibc.core.client.v1.IHeight|null);

            /** MsgTransfer timeout_timestamp */
            timeout_timestamp?: (Long|null);

            /** MsgTransfer fee */
            fee?: (neutron.feerefunder.IFee|null);
        }

        /** Represents a MsgTransfer. */
        class MsgTransfer implements IMsgTransfer {

            /**
             * Constructs a new MsgTransfer.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.transfer.IMsgTransfer);

            /** MsgTransfer source_port. */
            public source_port: string;

            /** MsgTransfer source_channel. */
            public source_channel: string;

            /** MsgTransfer token. */
            public token?: (cosmos.base.v1beta1.ICoin|null);

            /** MsgTransfer sender. */
            public sender: string;

            /** MsgTransfer receiver. */
            public receiver: string;

            /** MsgTransfer timeout_height. */
            public timeout_height?: (ibc.core.client.v1.IHeight|null);

            /** MsgTransfer timeout_timestamp. */
            public timeout_timestamp: Long;

            /** MsgTransfer fee. */
            public fee?: (neutron.feerefunder.IFee|null);

            /**
             * Encodes the specified MsgTransfer message. Does not implicitly {@link neutron.transfer.MsgTransfer.verify|verify} messages.
             * @param message MsgTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.transfer.IMsgTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgTransfer message, length delimited. Does not implicitly {@link neutron.transfer.MsgTransfer.verify|verify} messages.
             * @param message MsgTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.transfer.IMsgTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgTransfer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.transfer.MsgTransfer;

            /**
             * Decodes a MsgTransfer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.transfer.MsgTransfer;

            /**
             * Verifies a MsgTransfer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgTransfer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgTransfer
             */
            public static fromObject(object: { [k: string]: any }): neutron.transfer.MsgTransfer;

            /**
             * Creates a plain object from a MsgTransfer message. Also converts values to other types if specified.
             * @param message MsgTransfer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.transfer.MsgTransfer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgTransfer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MsgTransferResponse. */
        interface IMsgTransferResponse {

            /** MsgTransferResponse sequence_id */
            sequence_id?: (Long|null);

            /** MsgTransferResponse channel */
            channel?: (string|null);
        }

        /** Represents a MsgTransferResponse. */
        class MsgTransferResponse implements IMsgTransferResponse {

            /**
             * Constructs a new MsgTransferResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: neutron.transfer.IMsgTransferResponse);

            /** MsgTransferResponse sequence_id. */
            public sequence_id: Long;

            /** MsgTransferResponse channel. */
            public channel: string;

            /**
             * Encodes the specified MsgTransferResponse message. Does not implicitly {@link neutron.transfer.MsgTransferResponse.verify|verify} messages.
             * @param message MsgTransferResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: neutron.transfer.IMsgTransferResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MsgTransferResponse message, length delimited. Does not implicitly {@link neutron.transfer.MsgTransferResponse.verify|verify} messages.
             * @param message MsgTransferResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: neutron.transfer.IMsgTransferResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MsgTransferResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MsgTransferResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): neutron.transfer.MsgTransferResponse;

            /**
             * Decodes a MsgTransferResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MsgTransferResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): neutron.transfer.MsgTransferResponse;

            /**
             * Verifies a MsgTransferResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MsgTransferResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MsgTransferResponse
             */
            public static fromObject(object: { [k: string]: any }): neutron.transfer.MsgTransferResponse;

            /**
             * Creates a plain object from a MsgTransferResponse message. Also converts values to other types if specified.
             * @param message MsgTransferResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: neutron.transfer.MsgTransferResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MsgTransferResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Represents a Query */
        class Query extends $protobuf.rpc.Service {

            /**
             * Constructs a new Query service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls DenomTrace.
             * @param request QueryDenomTraceRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryDenomTraceResponse
             */
            public denomTrace(request: ibc.applications.transfer.v1.IQueryDenomTraceRequest, callback: neutron.transfer.Query.DenomTraceCallback): void;

            /**
             * Calls DenomTrace.
             * @param request QueryDenomTraceRequest message or plain object
             * @returns Promise
             */
            public denomTrace(request: ibc.applications.transfer.v1.IQueryDenomTraceRequest): Promise<ibc.applications.transfer.v1.QueryDenomTraceResponse>;

            /**
             * Calls DenomTraces.
             * @param request QueryDenomTracesRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryDenomTracesResponse
             */
            public denomTraces(request: ibc.applications.transfer.v1.IQueryDenomTracesRequest, callback: neutron.transfer.Query.DenomTracesCallback): void;

            /**
             * Calls DenomTraces.
             * @param request QueryDenomTracesRequest message or plain object
             * @returns Promise
             */
            public denomTraces(request: ibc.applications.transfer.v1.IQueryDenomTracesRequest): Promise<ibc.applications.transfer.v1.QueryDenomTracesResponse>;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
             */
            public params(request: ibc.applications.transfer.v1.IQueryParamsRequest, callback: neutron.transfer.Query.ParamsCallback): void;

            /**
             * Calls Params.
             * @param request QueryParamsRequest message or plain object
             * @returns Promise
             */
            public params(request: ibc.applications.transfer.v1.IQueryParamsRequest): Promise<ibc.applications.transfer.v1.QueryParamsResponse>;

            /**
             * Calls DenomHash.
             * @param request QueryDenomHashRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and QueryDenomHashResponse
             */
            public denomHash(request: ibc.applications.transfer.v1.IQueryDenomHashRequest, callback: neutron.transfer.Query.DenomHashCallback): void;

            /**
             * Calls DenomHash.
             * @param request QueryDenomHashRequest message or plain object
             * @returns Promise
             */
            public denomHash(request: ibc.applications.transfer.v1.IQueryDenomHashRequest): Promise<ibc.applications.transfer.v1.QueryDenomHashResponse>;
        }

        namespace Query {

            /**
             * Callback as used by {@link neutron.transfer.Query#denomTrace}.
             * @param error Error, if any
             * @param [response] QueryDenomTraceResponse
             */
            type DenomTraceCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomTraceResponse) => void;

            /**
             * Callback as used by {@link neutron.transfer.Query#denomTraces}.
             * @param error Error, if any
             * @param [response] QueryDenomTracesResponse
             */
            type DenomTracesCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomTracesResponse) => void;

            /**
             * Callback as used by {@link neutron.transfer.Query#params}.
             * @param error Error, if any
             * @param [response] QueryParamsResponse
             */
            type ParamsCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryParamsResponse) => void;

            /**
             * Callback as used by {@link neutron.transfer.Query#denomHash}.
             * @param error Error, if any
             * @param [response] QueryDenomHashResponse
             */
            type DenomHashCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomHashResponse) => void;
        }
    }
}

/** Namespace cosmos. */
export namespace cosmos {

    /** Namespace base. */
    namespace base {

        /** Namespace query. */
        namespace query {

            /** Namespace v1beta1. */
            namespace v1beta1 {

                /** Properties of a PageRequest. */
                interface IPageRequest {

                    /** PageRequest key */
                    key?: (Uint8Array|null);

                    /** PageRequest offset */
                    offset?: (Long|null);

                    /** PageRequest limit */
                    limit?: (Long|null);

                    /** PageRequest count_total */
                    count_total?: (boolean|null);

                    /** PageRequest reverse */
                    reverse?: (boolean|null);
                }

                /** Represents a PageRequest. */
                class PageRequest implements IPageRequest {

                    /**
                     * Constructs a new PageRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: cosmos.base.query.v1beta1.IPageRequest);

                    /** PageRequest key. */
                    public key: Uint8Array;

                    /** PageRequest offset. */
                    public offset: Long;

                    /** PageRequest limit. */
                    public limit: Long;

                    /** PageRequest count_total. */
                    public count_total: boolean;

                    /** PageRequest reverse. */
                    public reverse: boolean;

                    /**
                     * Encodes the specified PageRequest message. Does not implicitly {@link cosmos.base.query.v1beta1.PageRequest.verify|verify} messages.
                     * @param message PageRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: cosmos.base.query.v1beta1.IPageRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PageRequest message, length delimited. Does not implicitly {@link cosmos.base.query.v1beta1.PageRequest.verify|verify} messages.
                     * @param message PageRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: cosmos.base.query.v1beta1.IPageRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PageRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PageRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.query.v1beta1.PageRequest;

                    /**
                     * Decodes a PageRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PageRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.query.v1beta1.PageRequest;

                    /**
                     * Verifies a PageRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PageRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PageRequest
                     */
                    public static fromObject(object: { [k: string]: any }): cosmos.base.query.v1beta1.PageRequest;

                    /**
                     * Creates a plain object from a PageRequest message. Also converts values to other types if specified.
                     * @param message PageRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: cosmos.base.query.v1beta1.PageRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PageRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a PageResponse. */
                interface IPageResponse {

                    /** PageResponse next_key */
                    next_key?: (Uint8Array|null);

                    /** PageResponse total */
                    total?: (Long|null);
                }

                /** Represents a PageResponse. */
                class PageResponse implements IPageResponse {

                    /**
                     * Constructs a new PageResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: cosmos.base.query.v1beta1.IPageResponse);

                    /** PageResponse next_key. */
                    public next_key: Uint8Array;

                    /** PageResponse total. */
                    public total: Long;

                    /**
                     * Encodes the specified PageResponse message. Does not implicitly {@link cosmos.base.query.v1beta1.PageResponse.verify|verify} messages.
                     * @param message PageResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: cosmos.base.query.v1beta1.IPageResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PageResponse message, length delimited. Does not implicitly {@link cosmos.base.query.v1beta1.PageResponse.verify|verify} messages.
                     * @param message PageResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: cosmos.base.query.v1beta1.IPageResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PageResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PageResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.query.v1beta1.PageResponse;

                    /**
                     * Decodes a PageResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PageResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.query.v1beta1.PageResponse;

                    /**
                     * Verifies a PageResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PageResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PageResponse
                     */
                    public static fromObject(object: { [k: string]: any }): cosmos.base.query.v1beta1.PageResponse;

                    /**
                     * Creates a plain object from a PageResponse message. Also converts values to other types if specified.
                     * @param message PageResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: cosmos.base.query.v1beta1.PageResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PageResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }
        }

        /** Namespace v1beta1. */
        namespace v1beta1 {

            /** Properties of a Coin. */
            interface ICoin {

                /** Coin denom */
                denom?: (string|null);

                /** Coin amount */
                amount?: (string|null);
            }

            /** Represents a Coin. */
            class Coin implements ICoin {

                /**
                 * Constructs a new Coin.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.base.v1beta1.ICoin);

                /** Coin denom. */
                public denom: string;

                /** Coin amount. */
                public amount: string;

                /**
                 * Encodes the specified Coin message. Does not implicitly {@link cosmos.base.v1beta1.Coin.verify|verify} messages.
                 * @param message Coin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.base.v1beta1.ICoin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Coin message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.Coin.verify|verify} messages.
                 * @param message Coin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.base.v1beta1.ICoin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Coin message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Coin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.v1beta1.Coin;

                /**
                 * Decodes a Coin message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Coin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.v1beta1.Coin;

                /**
                 * Verifies a Coin message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Coin message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Coin
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.base.v1beta1.Coin;

                /**
                 * Creates a plain object from a Coin message. Also converts values to other types if specified.
                 * @param message Coin
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.base.v1beta1.Coin, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Coin to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a DecCoin. */
            interface IDecCoin {

                /** DecCoin denom */
                denom?: (string|null);

                /** DecCoin amount */
                amount?: (string|null);
            }

            /** Represents a DecCoin. */
            class DecCoin implements IDecCoin {

                /**
                 * Constructs a new DecCoin.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.base.v1beta1.IDecCoin);

                /** DecCoin denom. */
                public denom: string;

                /** DecCoin amount. */
                public amount: string;

                /**
                 * Encodes the specified DecCoin message. Does not implicitly {@link cosmos.base.v1beta1.DecCoin.verify|verify} messages.
                 * @param message DecCoin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.base.v1beta1.IDecCoin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DecCoin message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.DecCoin.verify|verify} messages.
                 * @param message DecCoin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.base.v1beta1.IDecCoin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DecCoin message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DecCoin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.v1beta1.DecCoin;

                /**
                 * Decodes a DecCoin message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DecCoin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.v1beta1.DecCoin;

                /**
                 * Verifies a DecCoin message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DecCoin message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DecCoin
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.base.v1beta1.DecCoin;

                /**
                 * Creates a plain object from a DecCoin message. Also converts values to other types if specified.
                 * @param message DecCoin
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.base.v1beta1.DecCoin, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DecCoin to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of an IntProto. */
            interface IIntProto {

                /** IntProto int */
                int?: (string|null);
            }

            /** Represents an IntProto. */
            class IntProto implements IIntProto {

                /**
                 * Constructs a new IntProto.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.base.v1beta1.IIntProto);

                /** IntProto int. */
                public int: string;

                /**
                 * Encodes the specified IntProto message. Does not implicitly {@link cosmos.base.v1beta1.IntProto.verify|verify} messages.
                 * @param message IntProto message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.base.v1beta1.IIntProto, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified IntProto message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.IntProto.verify|verify} messages.
                 * @param message IntProto message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.base.v1beta1.IIntProto, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an IntProto message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns IntProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.v1beta1.IntProto;

                /**
                 * Decodes an IntProto message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns IntProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.v1beta1.IntProto;

                /**
                 * Verifies an IntProto message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an IntProto message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns IntProto
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.base.v1beta1.IntProto;

                /**
                 * Creates a plain object from an IntProto message. Also converts values to other types if specified.
                 * @param message IntProto
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.base.v1beta1.IntProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this IntProto to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a DecProto. */
            interface IDecProto {

                /** DecProto dec */
                dec?: (string|null);
            }

            /** Represents a DecProto. */
            class DecProto implements IDecProto {

                /**
                 * Constructs a new DecProto.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.base.v1beta1.IDecProto);

                /** DecProto dec. */
                public dec: string;

                /**
                 * Encodes the specified DecProto message. Does not implicitly {@link cosmos.base.v1beta1.DecProto.verify|verify} messages.
                 * @param message DecProto message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.base.v1beta1.IDecProto, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DecProto message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.DecProto.verify|verify} messages.
                 * @param message DecProto message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.base.v1beta1.IDecProto, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DecProto message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DecProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.base.v1beta1.DecProto;

                /**
                 * Decodes a DecProto message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DecProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.base.v1beta1.DecProto;

                /**
                 * Verifies a DecProto message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DecProto message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DecProto
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.base.v1beta1.DecProto;

                /**
                 * Creates a plain object from a DecProto message. Also converts values to other types if specified.
                 * @param message DecProto
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.base.v1beta1.DecProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DecProto to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }

    /** Namespace upgrade. */
    namespace upgrade {

        /** Namespace v1beta1. */
        namespace v1beta1 {

            /** Properties of a Plan. */
            interface IPlan {

                /** Plan name */
                name?: (string|null);

                /** Plan time */
                time?: (google.protobuf.ITimestamp|null);

                /** Plan height */
                height?: (Long|null);

                /** Plan info */
                info?: (string|null);

                /** Plan upgraded_client_state */
                upgraded_client_state?: (google.protobuf.IAny|null);
            }

            /** Represents a Plan. */
            class Plan implements IPlan {

                /**
                 * Constructs a new Plan.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.upgrade.v1beta1.IPlan);

                /** Plan name. */
                public name: string;

                /** Plan time. */
                public time?: (google.protobuf.ITimestamp|null);

                /** Plan height. */
                public height: Long;

                /** Plan info. */
                public info: string;

                /** Plan upgraded_client_state. */
                public upgraded_client_state?: (google.protobuf.IAny|null);

                /**
                 * Encodes the specified Plan message. Does not implicitly {@link cosmos.upgrade.v1beta1.Plan.verify|verify} messages.
                 * @param message Plan message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.upgrade.v1beta1.IPlan, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Plan message, length delimited. Does not implicitly {@link cosmos.upgrade.v1beta1.Plan.verify|verify} messages.
                 * @param message Plan message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.upgrade.v1beta1.IPlan, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Plan message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Plan
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.upgrade.v1beta1.Plan;

                /**
                 * Decodes a Plan message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Plan
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.upgrade.v1beta1.Plan;

                /**
                 * Verifies a Plan message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Plan message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Plan
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.upgrade.v1beta1.Plan;

                /**
                 * Creates a plain object from a Plan message. Also converts values to other types if specified.
                 * @param message Plan
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.upgrade.v1beta1.Plan, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Plan to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a SoftwareUpgradeProposal. */
            interface ISoftwareUpgradeProposal {

                /** SoftwareUpgradeProposal title */
                title?: (string|null);

                /** SoftwareUpgradeProposal description */
                description?: (string|null);

                /** SoftwareUpgradeProposal plan */
                plan?: (cosmos.upgrade.v1beta1.IPlan|null);
            }

            /** Represents a SoftwareUpgradeProposal. */
            class SoftwareUpgradeProposal implements ISoftwareUpgradeProposal {

                /**
                 * Constructs a new SoftwareUpgradeProposal.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.upgrade.v1beta1.ISoftwareUpgradeProposal);

                /** SoftwareUpgradeProposal title. */
                public title: string;

                /** SoftwareUpgradeProposal description. */
                public description: string;

                /** SoftwareUpgradeProposal plan. */
                public plan?: (cosmos.upgrade.v1beta1.IPlan|null);

                /**
                 * Encodes the specified SoftwareUpgradeProposal message. Does not implicitly {@link cosmos.upgrade.v1beta1.SoftwareUpgradeProposal.verify|verify} messages.
                 * @param message SoftwareUpgradeProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.upgrade.v1beta1.ISoftwareUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified SoftwareUpgradeProposal message, length delimited. Does not implicitly {@link cosmos.upgrade.v1beta1.SoftwareUpgradeProposal.verify|verify} messages.
                 * @param message SoftwareUpgradeProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.upgrade.v1beta1.ISoftwareUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a SoftwareUpgradeProposal message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns SoftwareUpgradeProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.upgrade.v1beta1.SoftwareUpgradeProposal;

                /**
                 * Decodes a SoftwareUpgradeProposal message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns SoftwareUpgradeProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.upgrade.v1beta1.SoftwareUpgradeProposal;

                /**
                 * Verifies a SoftwareUpgradeProposal message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a SoftwareUpgradeProposal message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns SoftwareUpgradeProposal
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.upgrade.v1beta1.SoftwareUpgradeProposal;

                /**
                 * Creates a plain object from a SoftwareUpgradeProposal message. Also converts values to other types if specified.
                 * @param message SoftwareUpgradeProposal
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.upgrade.v1beta1.SoftwareUpgradeProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this SoftwareUpgradeProposal to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a CancelSoftwareUpgradeProposal. */
            interface ICancelSoftwareUpgradeProposal {

                /** CancelSoftwareUpgradeProposal title */
                title?: (string|null);

                /** CancelSoftwareUpgradeProposal description */
                description?: (string|null);
            }

            /** Represents a CancelSoftwareUpgradeProposal. */
            class CancelSoftwareUpgradeProposal implements ICancelSoftwareUpgradeProposal {

                /**
                 * Constructs a new CancelSoftwareUpgradeProposal.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.upgrade.v1beta1.ICancelSoftwareUpgradeProposal);

                /** CancelSoftwareUpgradeProposal title. */
                public title: string;

                /** CancelSoftwareUpgradeProposal description. */
                public description: string;

                /**
                 * Encodes the specified CancelSoftwareUpgradeProposal message. Does not implicitly {@link cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal.verify|verify} messages.
                 * @param message CancelSoftwareUpgradeProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.upgrade.v1beta1.ICancelSoftwareUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CancelSoftwareUpgradeProposal message, length delimited. Does not implicitly {@link cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal.verify|verify} messages.
                 * @param message CancelSoftwareUpgradeProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.upgrade.v1beta1.ICancelSoftwareUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CancelSoftwareUpgradeProposal message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CancelSoftwareUpgradeProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal;

                /**
                 * Decodes a CancelSoftwareUpgradeProposal message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CancelSoftwareUpgradeProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal;

                /**
                 * Verifies a CancelSoftwareUpgradeProposal message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CancelSoftwareUpgradeProposal message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CancelSoftwareUpgradeProposal
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal;

                /**
                 * Creates a plain object from a CancelSoftwareUpgradeProposal message. Also converts values to other types if specified.
                 * @param message CancelSoftwareUpgradeProposal
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CancelSoftwareUpgradeProposal to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ModuleVersion. */
            interface IModuleVersion {

                /** ModuleVersion name */
                name?: (string|null);

                /** ModuleVersion version */
                version?: (Long|null);
            }

            /** Represents a ModuleVersion. */
            class ModuleVersion implements IModuleVersion {

                /**
                 * Constructs a new ModuleVersion.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.upgrade.v1beta1.IModuleVersion);

                /** ModuleVersion name. */
                public name: string;

                /** ModuleVersion version. */
                public version: Long;

                /**
                 * Encodes the specified ModuleVersion message. Does not implicitly {@link cosmos.upgrade.v1beta1.ModuleVersion.verify|verify} messages.
                 * @param message ModuleVersion message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.upgrade.v1beta1.IModuleVersion, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ModuleVersion message, length delimited. Does not implicitly {@link cosmos.upgrade.v1beta1.ModuleVersion.verify|verify} messages.
                 * @param message ModuleVersion message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.upgrade.v1beta1.IModuleVersion, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ModuleVersion message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ModuleVersion
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.upgrade.v1beta1.ModuleVersion;

                /**
                 * Decodes a ModuleVersion message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ModuleVersion
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.upgrade.v1beta1.ModuleVersion;

                /**
                 * Verifies a ModuleVersion message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ModuleVersion message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ModuleVersion
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.upgrade.v1beta1.ModuleVersion;

                /**
                 * Creates a plain object from a ModuleVersion message. Also converts values to other types if specified.
                 * @param message ModuleVersion
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.upgrade.v1beta1.ModuleVersion, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ModuleVersion to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }
}

/** Namespace tendermint. */
export namespace tendermint {

    /** Namespace crypto. */
    namespace crypto {

        /** Properties of a Proof. */
        interface IProof {

            /** Proof total */
            total?: (Long|null);

            /** Proof index */
            index?: (Long|null);

            /** Proof leaf_hash */
            leaf_hash?: (Uint8Array|null);

            /** Proof aunts */
            aunts?: (Uint8Array[]|null);
        }

        /** Represents a Proof. */
        class Proof implements IProof {

            /**
             * Constructs a new Proof.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IProof);

            /** Proof total. */
            public total: Long;

            /** Proof index. */
            public index: Long;

            /** Proof leaf_hash. */
            public leaf_hash: Uint8Array;

            /** Proof aunts. */
            public aunts: Uint8Array[];

            /**
             * Encodes the specified Proof message. Does not implicitly {@link tendermint.crypto.Proof.verify|verify} messages.
             * @param message Proof message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IProof, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Proof message, length delimited. Does not implicitly {@link tendermint.crypto.Proof.verify|verify} messages.
             * @param message Proof message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IProof, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Proof message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Proof
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.Proof;

            /**
             * Decodes a Proof message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Proof
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.Proof;

            /**
             * Verifies a Proof message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Proof message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Proof
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.Proof;

            /**
             * Creates a plain object from a Proof message. Also converts values to other types if specified.
             * @param message Proof
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.Proof, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Proof to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ValueOp. */
        interface IValueOp {

            /** ValueOp key */
            key?: (Uint8Array|null);

            /** ValueOp proof */
            proof?: (tendermint.crypto.IProof|null);
        }

        /** Represents a ValueOp. */
        class ValueOp implements IValueOp {

            /**
             * Constructs a new ValueOp.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IValueOp);

            /** ValueOp key. */
            public key: Uint8Array;

            /** ValueOp proof. */
            public proof?: (tendermint.crypto.IProof|null);

            /**
             * Encodes the specified ValueOp message. Does not implicitly {@link tendermint.crypto.ValueOp.verify|verify} messages.
             * @param message ValueOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IValueOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ValueOp message, length delimited. Does not implicitly {@link tendermint.crypto.ValueOp.verify|verify} messages.
             * @param message ValueOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IValueOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ValueOp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ValueOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.ValueOp;

            /**
             * Decodes a ValueOp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ValueOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.ValueOp;

            /**
             * Verifies a ValueOp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ValueOp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ValueOp
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.ValueOp;

            /**
             * Creates a plain object from a ValueOp message. Also converts values to other types if specified.
             * @param message ValueOp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.ValueOp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ValueOp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a DominoOp. */
        interface IDominoOp {

            /** DominoOp key */
            key?: (string|null);

            /** DominoOp input */
            input?: (string|null);

            /** DominoOp output */
            output?: (string|null);
        }

        /** Represents a DominoOp. */
        class DominoOp implements IDominoOp {

            /**
             * Constructs a new DominoOp.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IDominoOp);

            /** DominoOp key. */
            public key: string;

            /** DominoOp input. */
            public input: string;

            /** DominoOp output. */
            public output: string;

            /**
             * Encodes the specified DominoOp message. Does not implicitly {@link tendermint.crypto.DominoOp.verify|verify} messages.
             * @param message DominoOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IDominoOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DominoOp message, length delimited. Does not implicitly {@link tendermint.crypto.DominoOp.verify|verify} messages.
             * @param message DominoOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IDominoOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DominoOp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DominoOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.DominoOp;

            /**
             * Decodes a DominoOp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DominoOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.DominoOp;

            /**
             * Verifies a DominoOp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DominoOp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DominoOp
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.DominoOp;

            /**
             * Creates a plain object from a DominoOp message. Also converts values to other types if specified.
             * @param message DominoOp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.DominoOp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DominoOp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ProofOp. */
        interface IProofOp {

            /** ProofOp type */
            type?: (string|null);

            /** ProofOp key */
            key?: (Uint8Array|null);

            /** ProofOp data */
            data?: (Uint8Array|null);
        }

        /** Represents a ProofOp. */
        class ProofOp implements IProofOp {

            /**
             * Constructs a new ProofOp.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IProofOp);

            /** ProofOp type. */
            public type: string;

            /** ProofOp key. */
            public key: Uint8Array;

            /** ProofOp data. */
            public data: Uint8Array;

            /**
             * Encodes the specified ProofOp message. Does not implicitly {@link tendermint.crypto.ProofOp.verify|verify} messages.
             * @param message ProofOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IProofOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ProofOp message, length delimited. Does not implicitly {@link tendermint.crypto.ProofOp.verify|verify} messages.
             * @param message ProofOp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IProofOp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ProofOp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ProofOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.ProofOp;

            /**
             * Decodes a ProofOp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ProofOp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.ProofOp;

            /**
             * Verifies a ProofOp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ProofOp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ProofOp
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.ProofOp;

            /**
             * Creates a plain object from a ProofOp message. Also converts values to other types if specified.
             * @param message ProofOp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.ProofOp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ProofOp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ProofOps. */
        interface IProofOps {

            /** ProofOps ops */
            ops?: (tendermint.crypto.IProofOp[]|null);
        }

        /** Represents a ProofOps. */
        class ProofOps implements IProofOps {

            /**
             * Constructs a new ProofOps.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IProofOps);

            /** ProofOps ops. */
            public ops: tendermint.crypto.IProofOp[];

            /**
             * Encodes the specified ProofOps message. Does not implicitly {@link tendermint.crypto.ProofOps.verify|verify} messages.
             * @param message ProofOps message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IProofOps, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ProofOps message, length delimited. Does not implicitly {@link tendermint.crypto.ProofOps.verify|verify} messages.
             * @param message ProofOps message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IProofOps, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ProofOps message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ProofOps
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.ProofOps;

            /**
             * Decodes a ProofOps message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ProofOps
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.ProofOps;

            /**
             * Verifies a ProofOps message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ProofOps message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ProofOps
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.ProofOps;

            /**
             * Creates a plain object from a ProofOps message. Also converts values to other types if specified.
             * @param message ProofOps
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.ProofOps, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ProofOps to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a PublicKey. */
        interface IPublicKey {

            /** PublicKey ed25519 */
            ed25519?: (Uint8Array|null);

            /** PublicKey secp256k1 */
            secp256k1?: (Uint8Array|null);
        }

        /** Represents a PublicKey. */
        class PublicKey implements IPublicKey {

            /**
             * Constructs a new PublicKey.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.crypto.IPublicKey);

            /** PublicKey ed25519. */
            public ed25519?: (Uint8Array|null);

            /** PublicKey secp256k1. */
            public secp256k1?: (Uint8Array|null);

            /** PublicKey sum. */
            public sum?: ("ed25519"|"secp256k1");

            /**
             * Encodes the specified PublicKey message. Does not implicitly {@link tendermint.crypto.PublicKey.verify|verify} messages.
             * @param message PublicKey message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.crypto.IPublicKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PublicKey message, length delimited. Does not implicitly {@link tendermint.crypto.PublicKey.verify|verify} messages.
             * @param message PublicKey message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.crypto.IPublicKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PublicKey message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PublicKey
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.crypto.PublicKey;

            /**
             * Decodes a PublicKey message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PublicKey
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.crypto.PublicKey;

            /**
             * Verifies a PublicKey message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PublicKey message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PublicKey
             */
            public static fromObject(object: { [k: string]: any }): tendermint.crypto.PublicKey;

            /**
             * Creates a plain object from a PublicKey message. Also converts values to other types if specified.
             * @param message PublicKey
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.crypto.PublicKey, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PublicKey to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace abci. */
    namespace abci {

        /** Properties of a Request. */
        interface IRequest {

            /** Request echo */
            echo?: (tendermint.abci.IRequestEcho|null);

            /** Request flush */
            flush?: (tendermint.abci.IRequestFlush|null);

            /** Request info */
            info?: (tendermint.abci.IRequestInfo|null);

            /** Request set_option */
            set_option?: (tendermint.abci.IRequestSetOption|null);

            /** Request init_chain */
            init_chain?: (tendermint.abci.IRequestInitChain|null);

            /** Request query */
            query?: (tendermint.abci.IRequestQuery|null);

            /** Request begin_block */
            begin_block?: (tendermint.abci.IRequestBeginBlock|null);

            /** Request check_tx */
            check_tx?: (tendermint.abci.IRequestCheckTx|null);

            /** Request deliver_tx */
            deliver_tx?: (tendermint.abci.IRequestDeliverTx|null);

            /** Request end_block */
            end_block?: (tendermint.abci.IRequestEndBlock|null);

            /** Request commit */
            commit?: (tendermint.abci.IRequestCommit|null);

            /** Request list_snapshots */
            list_snapshots?: (tendermint.abci.IRequestListSnapshots|null);

            /** Request offer_snapshot */
            offer_snapshot?: (tendermint.abci.IRequestOfferSnapshot|null);

            /** Request load_snapshot_chunk */
            load_snapshot_chunk?: (tendermint.abci.IRequestLoadSnapshotChunk|null);

            /** Request apply_snapshot_chunk */
            apply_snapshot_chunk?: (tendermint.abci.IRequestApplySnapshotChunk|null);
        }

        /** Represents a Request. */
        class Request implements IRequest {

            /**
             * Constructs a new Request.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequest);

            /** Request echo. */
            public echo?: (tendermint.abci.IRequestEcho|null);

            /** Request flush. */
            public flush?: (tendermint.abci.IRequestFlush|null);

            /** Request info. */
            public info?: (tendermint.abci.IRequestInfo|null);

            /** Request set_option. */
            public set_option?: (tendermint.abci.IRequestSetOption|null);

            /** Request init_chain. */
            public init_chain?: (tendermint.abci.IRequestInitChain|null);

            /** Request query. */
            public query?: (tendermint.abci.IRequestQuery|null);

            /** Request begin_block. */
            public begin_block?: (tendermint.abci.IRequestBeginBlock|null);

            /** Request check_tx. */
            public check_tx?: (tendermint.abci.IRequestCheckTx|null);

            /** Request deliver_tx. */
            public deliver_tx?: (tendermint.abci.IRequestDeliverTx|null);

            /** Request end_block. */
            public end_block?: (tendermint.abci.IRequestEndBlock|null);

            /** Request commit. */
            public commit?: (tendermint.abci.IRequestCommit|null);

            /** Request list_snapshots. */
            public list_snapshots?: (tendermint.abci.IRequestListSnapshots|null);

            /** Request offer_snapshot. */
            public offer_snapshot?: (tendermint.abci.IRequestOfferSnapshot|null);

            /** Request load_snapshot_chunk. */
            public load_snapshot_chunk?: (tendermint.abci.IRequestLoadSnapshotChunk|null);

            /** Request apply_snapshot_chunk. */
            public apply_snapshot_chunk?: (tendermint.abci.IRequestApplySnapshotChunk|null);

            /** Request value. */
            public value?: ("echo"|"flush"|"info"|"set_option"|"init_chain"|"query"|"begin_block"|"check_tx"|"deliver_tx"|"end_block"|"commit"|"list_snapshots"|"offer_snapshot"|"load_snapshot_chunk"|"apply_snapshot_chunk");

            /**
             * Encodes the specified Request message. Does not implicitly {@link tendermint.abci.Request.verify|verify} messages.
             * @param message Request message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Request message, length delimited. Does not implicitly {@link tendermint.abci.Request.verify|verify} messages.
             * @param message Request message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Request message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Request
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Request;

            /**
             * Decodes a Request message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Request
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Request;

            /**
             * Verifies a Request message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Request message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Request
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Request;

            /**
             * Creates a plain object from a Request message. Also converts values to other types if specified.
             * @param message Request
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Request to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestEcho. */
        interface IRequestEcho {

            /** RequestEcho message */
            message?: (string|null);
        }

        /** Represents a RequestEcho. */
        class RequestEcho implements IRequestEcho {

            /**
             * Constructs a new RequestEcho.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestEcho);

            /** RequestEcho message. */
            public message: string;

            /**
             * Encodes the specified RequestEcho message. Does not implicitly {@link tendermint.abci.RequestEcho.verify|verify} messages.
             * @param message RequestEcho message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestEcho, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestEcho message, length delimited. Does not implicitly {@link tendermint.abci.RequestEcho.verify|verify} messages.
             * @param message RequestEcho message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestEcho, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestEcho message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestEcho
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestEcho;

            /**
             * Decodes a RequestEcho message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestEcho
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestEcho;

            /**
             * Verifies a RequestEcho message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestEcho message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestEcho
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestEcho;

            /**
             * Creates a plain object from a RequestEcho message. Also converts values to other types if specified.
             * @param message RequestEcho
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestEcho, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestEcho to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestFlush. */
        interface IRequestFlush {
        }

        /** Represents a RequestFlush. */
        class RequestFlush implements IRequestFlush {

            /**
             * Constructs a new RequestFlush.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestFlush);

            /**
             * Encodes the specified RequestFlush message. Does not implicitly {@link tendermint.abci.RequestFlush.verify|verify} messages.
             * @param message RequestFlush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestFlush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestFlush message, length delimited. Does not implicitly {@link tendermint.abci.RequestFlush.verify|verify} messages.
             * @param message RequestFlush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestFlush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestFlush message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestFlush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestFlush;

            /**
             * Decodes a RequestFlush message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestFlush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestFlush;

            /**
             * Verifies a RequestFlush message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestFlush message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestFlush
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestFlush;

            /**
             * Creates a plain object from a RequestFlush message. Also converts values to other types if specified.
             * @param message RequestFlush
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestFlush, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestFlush to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestInfo. */
        interface IRequestInfo {

            /** RequestInfo version */
            version?: (string|null);

            /** RequestInfo block_version */
            block_version?: (Long|null);

            /** RequestInfo p2p_version */
            p2p_version?: (Long|null);
        }

        /** Represents a RequestInfo. */
        class RequestInfo implements IRequestInfo {

            /**
             * Constructs a new RequestInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestInfo);

            /** RequestInfo version. */
            public version: string;

            /** RequestInfo block_version. */
            public block_version: Long;

            /** RequestInfo p2p_version. */
            public p2p_version: Long;

            /**
             * Encodes the specified RequestInfo message. Does not implicitly {@link tendermint.abci.RequestInfo.verify|verify} messages.
             * @param message RequestInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestInfo message, length delimited. Does not implicitly {@link tendermint.abci.RequestInfo.verify|verify} messages.
             * @param message RequestInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestInfo;

            /**
             * Decodes a RequestInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestInfo;

            /**
             * Verifies a RequestInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestInfo
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestInfo;

            /**
             * Creates a plain object from a RequestInfo message. Also converts values to other types if specified.
             * @param message RequestInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestSetOption. */
        interface IRequestSetOption {

            /** RequestSetOption key */
            key?: (string|null);

            /** RequestSetOption value */
            value?: (string|null);
        }

        /** Represents a RequestSetOption. */
        class RequestSetOption implements IRequestSetOption {

            /**
             * Constructs a new RequestSetOption.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestSetOption);

            /** RequestSetOption key. */
            public key: string;

            /** RequestSetOption value. */
            public value: string;

            /**
             * Encodes the specified RequestSetOption message. Does not implicitly {@link tendermint.abci.RequestSetOption.verify|verify} messages.
             * @param message RequestSetOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestSetOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestSetOption message, length delimited. Does not implicitly {@link tendermint.abci.RequestSetOption.verify|verify} messages.
             * @param message RequestSetOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestSetOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestSetOption message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestSetOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestSetOption;

            /**
             * Decodes a RequestSetOption message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestSetOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestSetOption;

            /**
             * Verifies a RequestSetOption message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestSetOption message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestSetOption
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestSetOption;

            /**
             * Creates a plain object from a RequestSetOption message. Also converts values to other types if specified.
             * @param message RequestSetOption
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestSetOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestSetOption to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestInitChain. */
        interface IRequestInitChain {

            /** RequestInitChain time */
            time?: (google.protobuf.ITimestamp|null);

            /** RequestInitChain chain_id */
            chain_id?: (string|null);

            /** RequestInitChain consensus_params */
            consensus_params?: (tendermint.abci.IConsensusParams|null);

            /** RequestInitChain validators */
            validators?: (tendermint.abci.IValidatorUpdate[]|null);

            /** RequestInitChain app_state_bytes */
            app_state_bytes?: (Uint8Array|null);

            /** RequestInitChain initial_height */
            initial_height?: (Long|null);
        }

        /** Represents a RequestInitChain. */
        class RequestInitChain implements IRequestInitChain {

            /**
             * Constructs a new RequestInitChain.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestInitChain);

            /** RequestInitChain time. */
            public time?: (google.protobuf.ITimestamp|null);

            /** RequestInitChain chain_id. */
            public chain_id: string;

            /** RequestInitChain consensus_params. */
            public consensus_params?: (tendermint.abci.IConsensusParams|null);

            /** RequestInitChain validators. */
            public validators: tendermint.abci.IValidatorUpdate[];

            /** RequestInitChain app_state_bytes. */
            public app_state_bytes: Uint8Array;

            /** RequestInitChain initial_height. */
            public initial_height: Long;

            /**
             * Encodes the specified RequestInitChain message. Does not implicitly {@link tendermint.abci.RequestInitChain.verify|verify} messages.
             * @param message RequestInitChain message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestInitChain, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestInitChain message, length delimited. Does not implicitly {@link tendermint.abci.RequestInitChain.verify|verify} messages.
             * @param message RequestInitChain message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestInitChain, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestInitChain message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestInitChain
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestInitChain;

            /**
             * Decodes a RequestInitChain message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestInitChain
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestInitChain;

            /**
             * Verifies a RequestInitChain message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestInitChain message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestInitChain
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestInitChain;

            /**
             * Creates a plain object from a RequestInitChain message. Also converts values to other types if specified.
             * @param message RequestInitChain
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestInitChain, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestInitChain to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestQuery. */
        interface IRequestQuery {

            /** RequestQuery data */
            data?: (Uint8Array|null);

            /** RequestQuery path */
            path?: (string|null);

            /** RequestQuery height */
            height?: (Long|null);

            /** RequestQuery prove */
            prove?: (boolean|null);
        }

        /** Represents a RequestQuery. */
        class RequestQuery implements IRequestQuery {

            /**
             * Constructs a new RequestQuery.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestQuery);

            /** RequestQuery data. */
            public data: Uint8Array;

            /** RequestQuery path. */
            public path: string;

            /** RequestQuery height. */
            public height: Long;

            /** RequestQuery prove. */
            public prove: boolean;

            /**
             * Encodes the specified RequestQuery message. Does not implicitly {@link tendermint.abci.RequestQuery.verify|verify} messages.
             * @param message RequestQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestQuery message, length delimited. Does not implicitly {@link tendermint.abci.RequestQuery.verify|verify} messages.
             * @param message RequestQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestQuery message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestQuery;

            /**
             * Decodes a RequestQuery message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestQuery;

            /**
             * Verifies a RequestQuery message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestQuery message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestQuery
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestQuery;

            /**
             * Creates a plain object from a RequestQuery message. Also converts values to other types if specified.
             * @param message RequestQuery
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestQuery, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestQuery to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestBeginBlock. */
        interface IRequestBeginBlock {

            /** RequestBeginBlock hash */
            hash?: (Uint8Array|null);

            /** RequestBeginBlock header */
            header?: (tendermint.types.IHeader|null);

            /** RequestBeginBlock last_commit_info */
            last_commit_info?: (tendermint.abci.ILastCommitInfo|null);

            /** RequestBeginBlock byzantine_validators */
            byzantine_validators?: (tendermint.abci.IEvidence[]|null);
        }

        /** Represents a RequestBeginBlock. */
        class RequestBeginBlock implements IRequestBeginBlock {

            /**
             * Constructs a new RequestBeginBlock.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestBeginBlock);

            /** RequestBeginBlock hash. */
            public hash: Uint8Array;

            /** RequestBeginBlock header. */
            public header?: (tendermint.types.IHeader|null);

            /** RequestBeginBlock last_commit_info. */
            public last_commit_info?: (tendermint.abci.ILastCommitInfo|null);

            /** RequestBeginBlock byzantine_validators. */
            public byzantine_validators: tendermint.abci.IEvidence[];

            /**
             * Encodes the specified RequestBeginBlock message. Does not implicitly {@link tendermint.abci.RequestBeginBlock.verify|verify} messages.
             * @param message RequestBeginBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestBeginBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestBeginBlock message, length delimited. Does not implicitly {@link tendermint.abci.RequestBeginBlock.verify|verify} messages.
             * @param message RequestBeginBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestBeginBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestBeginBlock message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestBeginBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestBeginBlock;

            /**
             * Decodes a RequestBeginBlock message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestBeginBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestBeginBlock;

            /**
             * Verifies a RequestBeginBlock message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestBeginBlock message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestBeginBlock
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestBeginBlock;

            /**
             * Creates a plain object from a RequestBeginBlock message. Also converts values to other types if specified.
             * @param message RequestBeginBlock
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestBeginBlock, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestBeginBlock to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** CheckTxType enum. */
        enum CheckTxType {
            NEW = 0,
            RECHECK = 1
        }

        /** Properties of a RequestCheckTx. */
        interface IRequestCheckTx {

            /** RequestCheckTx tx */
            tx?: (Uint8Array|null);

            /** RequestCheckTx type */
            type?: (tendermint.abci.CheckTxType|null);
        }

        /** Represents a RequestCheckTx. */
        class RequestCheckTx implements IRequestCheckTx {

            /**
             * Constructs a new RequestCheckTx.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestCheckTx);

            /** RequestCheckTx tx. */
            public tx: Uint8Array;

            /** RequestCheckTx type. */
            public type: tendermint.abci.CheckTxType;

            /**
             * Encodes the specified RequestCheckTx message. Does not implicitly {@link tendermint.abci.RequestCheckTx.verify|verify} messages.
             * @param message RequestCheckTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestCheckTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestCheckTx message, length delimited. Does not implicitly {@link tendermint.abci.RequestCheckTx.verify|verify} messages.
             * @param message RequestCheckTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestCheckTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestCheckTx message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestCheckTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestCheckTx;

            /**
             * Decodes a RequestCheckTx message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestCheckTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestCheckTx;

            /**
             * Verifies a RequestCheckTx message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestCheckTx message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestCheckTx
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestCheckTx;

            /**
             * Creates a plain object from a RequestCheckTx message. Also converts values to other types if specified.
             * @param message RequestCheckTx
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestCheckTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestCheckTx to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestDeliverTx. */
        interface IRequestDeliverTx {

            /** RequestDeliverTx tx */
            tx?: (Uint8Array|null);
        }

        /** Represents a RequestDeliverTx. */
        class RequestDeliverTx implements IRequestDeliverTx {

            /**
             * Constructs a new RequestDeliverTx.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestDeliverTx);

            /** RequestDeliverTx tx. */
            public tx: Uint8Array;

            /**
             * Encodes the specified RequestDeliverTx message. Does not implicitly {@link tendermint.abci.RequestDeliverTx.verify|verify} messages.
             * @param message RequestDeliverTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestDeliverTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestDeliverTx message, length delimited. Does not implicitly {@link tendermint.abci.RequestDeliverTx.verify|verify} messages.
             * @param message RequestDeliverTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestDeliverTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestDeliverTx message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestDeliverTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestDeliverTx;

            /**
             * Decodes a RequestDeliverTx message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestDeliverTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestDeliverTx;

            /**
             * Verifies a RequestDeliverTx message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestDeliverTx message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestDeliverTx
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestDeliverTx;

            /**
             * Creates a plain object from a RequestDeliverTx message. Also converts values to other types if specified.
             * @param message RequestDeliverTx
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestDeliverTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestDeliverTx to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestEndBlock. */
        interface IRequestEndBlock {

            /** RequestEndBlock height */
            height?: (Long|null);
        }

        /** Represents a RequestEndBlock. */
        class RequestEndBlock implements IRequestEndBlock {

            /**
             * Constructs a new RequestEndBlock.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestEndBlock);

            /** RequestEndBlock height. */
            public height: Long;

            /**
             * Encodes the specified RequestEndBlock message. Does not implicitly {@link tendermint.abci.RequestEndBlock.verify|verify} messages.
             * @param message RequestEndBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestEndBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestEndBlock message, length delimited. Does not implicitly {@link tendermint.abci.RequestEndBlock.verify|verify} messages.
             * @param message RequestEndBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestEndBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestEndBlock message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestEndBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestEndBlock;

            /**
             * Decodes a RequestEndBlock message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestEndBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestEndBlock;

            /**
             * Verifies a RequestEndBlock message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestEndBlock message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestEndBlock
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestEndBlock;

            /**
             * Creates a plain object from a RequestEndBlock message. Also converts values to other types if specified.
             * @param message RequestEndBlock
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestEndBlock, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestEndBlock to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestCommit. */
        interface IRequestCommit {
        }

        /** Represents a RequestCommit. */
        class RequestCommit implements IRequestCommit {

            /**
             * Constructs a new RequestCommit.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestCommit);

            /**
             * Encodes the specified RequestCommit message. Does not implicitly {@link tendermint.abci.RequestCommit.verify|verify} messages.
             * @param message RequestCommit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestCommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestCommit message, length delimited. Does not implicitly {@link tendermint.abci.RequestCommit.verify|verify} messages.
             * @param message RequestCommit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestCommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestCommit message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestCommit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestCommit;

            /**
             * Decodes a RequestCommit message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestCommit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestCommit;

            /**
             * Verifies a RequestCommit message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestCommit message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestCommit
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestCommit;

            /**
             * Creates a plain object from a RequestCommit message. Also converts values to other types if specified.
             * @param message RequestCommit
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestCommit, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestCommit to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestListSnapshots. */
        interface IRequestListSnapshots {
        }

        /** Represents a RequestListSnapshots. */
        class RequestListSnapshots implements IRequestListSnapshots {

            /**
             * Constructs a new RequestListSnapshots.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestListSnapshots);

            /**
             * Encodes the specified RequestListSnapshots message. Does not implicitly {@link tendermint.abci.RequestListSnapshots.verify|verify} messages.
             * @param message RequestListSnapshots message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestListSnapshots, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestListSnapshots message, length delimited. Does not implicitly {@link tendermint.abci.RequestListSnapshots.verify|verify} messages.
             * @param message RequestListSnapshots message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestListSnapshots, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestListSnapshots message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestListSnapshots
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestListSnapshots;

            /**
             * Decodes a RequestListSnapshots message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestListSnapshots
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestListSnapshots;

            /**
             * Verifies a RequestListSnapshots message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestListSnapshots message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestListSnapshots
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestListSnapshots;

            /**
             * Creates a plain object from a RequestListSnapshots message. Also converts values to other types if specified.
             * @param message RequestListSnapshots
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestListSnapshots, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestListSnapshots to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestOfferSnapshot. */
        interface IRequestOfferSnapshot {

            /** RequestOfferSnapshot snapshot */
            snapshot?: (tendermint.abci.ISnapshot|null);

            /** RequestOfferSnapshot app_hash */
            app_hash?: (Uint8Array|null);
        }

        /** Represents a RequestOfferSnapshot. */
        class RequestOfferSnapshot implements IRequestOfferSnapshot {

            /**
             * Constructs a new RequestOfferSnapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestOfferSnapshot);

            /** RequestOfferSnapshot snapshot. */
            public snapshot?: (tendermint.abci.ISnapshot|null);

            /** RequestOfferSnapshot app_hash. */
            public app_hash: Uint8Array;

            /**
             * Encodes the specified RequestOfferSnapshot message. Does not implicitly {@link tendermint.abci.RequestOfferSnapshot.verify|verify} messages.
             * @param message RequestOfferSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestOfferSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestOfferSnapshot message, length delimited. Does not implicitly {@link tendermint.abci.RequestOfferSnapshot.verify|verify} messages.
             * @param message RequestOfferSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestOfferSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestOfferSnapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestOfferSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestOfferSnapshot;

            /**
             * Decodes a RequestOfferSnapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestOfferSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestOfferSnapshot;

            /**
             * Verifies a RequestOfferSnapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestOfferSnapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestOfferSnapshot
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestOfferSnapshot;

            /**
             * Creates a plain object from a RequestOfferSnapshot message. Also converts values to other types if specified.
             * @param message RequestOfferSnapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestOfferSnapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestOfferSnapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestLoadSnapshotChunk. */
        interface IRequestLoadSnapshotChunk {

            /** RequestLoadSnapshotChunk height */
            height?: (Long|null);

            /** RequestLoadSnapshotChunk format */
            format?: (number|null);

            /** RequestLoadSnapshotChunk chunk */
            chunk?: (number|null);
        }

        /** Represents a RequestLoadSnapshotChunk. */
        class RequestLoadSnapshotChunk implements IRequestLoadSnapshotChunk {

            /**
             * Constructs a new RequestLoadSnapshotChunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestLoadSnapshotChunk);

            /** RequestLoadSnapshotChunk height. */
            public height: Long;

            /** RequestLoadSnapshotChunk format. */
            public format: number;

            /** RequestLoadSnapshotChunk chunk. */
            public chunk: number;

            /**
             * Encodes the specified RequestLoadSnapshotChunk message. Does not implicitly {@link tendermint.abci.RequestLoadSnapshotChunk.verify|verify} messages.
             * @param message RequestLoadSnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestLoadSnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestLoadSnapshotChunk message, length delimited. Does not implicitly {@link tendermint.abci.RequestLoadSnapshotChunk.verify|verify} messages.
             * @param message RequestLoadSnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestLoadSnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestLoadSnapshotChunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestLoadSnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestLoadSnapshotChunk;

            /**
             * Decodes a RequestLoadSnapshotChunk message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestLoadSnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestLoadSnapshotChunk;

            /**
             * Verifies a RequestLoadSnapshotChunk message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestLoadSnapshotChunk message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestLoadSnapshotChunk
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestLoadSnapshotChunk;

            /**
             * Creates a plain object from a RequestLoadSnapshotChunk message. Also converts values to other types if specified.
             * @param message RequestLoadSnapshotChunk
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestLoadSnapshotChunk, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestLoadSnapshotChunk to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a RequestApplySnapshotChunk. */
        interface IRequestApplySnapshotChunk {

            /** RequestApplySnapshotChunk index */
            index?: (number|null);

            /** RequestApplySnapshotChunk chunk */
            chunk?: (Uint8Array|null);

            /** RequestApplySnapshotChunk sender */
            sender?: (string|null);
        }

        /** Represents a RequestApplySnapshotChunk. */
        class RequestApplySnapshotChunk implements IRequestApplySnapshotChunk {

            /**
             * Constructs a new RequestApplySnapshotChunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IRequestApplySnapshotChunk);

            /** RequestApplySnapshotChunk index. */
            public index: number;

            /** RequestApplySnapshotChunk chunk. */
            public chunk: Uint8Array;

            /** RequestApplySnapshotChunk sender. */
            public sender: string;

            /**
             * Encodes the specified RequestApplySnapshotChunk message. Does not implicitly {@link tendermint.abci.RequestApplySnapshotChunk.verify|verify} messages.
             * @param message RequestApplySnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IRequestApplySnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestApplySnapshotChunk message, length delimited. Does not implicitly {@link tendermint.abci.RequestApplySnapshotChunk.verify|verify} messages.
             * @param message RequestApplySnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IRequestApplySnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestApplySnapshotChunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestApplySnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.RequestApplySnapshotChunk;

            /**
             * Decodes a RequestApplySnapshotChunk message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestApplySnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.RequestApplySnapshotChunk;

            /**
             * Verifies a RequestApplySnapshotChunk message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestApplySnapshotChunk message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestApplySnapshotChunk
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.RequestApplySnapshotChunk;

            /**
             * Creates a plain object from a RequestApplySnapshotChunk message. Also converts values to other types if specified.
             * @param message RequestApplySnapshotChunk
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.RequestApplySnapshotChunk, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestApplySnapshotChunk to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Response. */
        interface IResponse {

            /** Response exception */
            exception?: (tendermint.abci.IResponseException|null);

            /** Response echo */
            echo?: (tendermint.abci.IResponseEcho|null);

            /** Response flush */
            flush?: (tendermint.abci.IResponseFlush|null);

            /** Response info */
            info?: (tendermint.abci.IResponseInfo|null);

            /** Response set_option */
            set_option?: (tendermint.abci.IResponseSetOption|null);

            /** Response init_chain */
            init_chain?: (tendermint.abci.IResponseInitChain|null);

            /** Response query */
            query?: (tendermint.abci.IResponseQuery|null);

            /** Response begin_block */
            begin_block?: (tendermint.abci.IResponseBeginBlock|null);

            /** Response check_tx */
            check_tx?: (tendermint.abci.IResponseCheckTx|null);

            /** Response deliver_tx */
            deliver_tx?: (tendermint.abci.IResponseDeliverTx|null);

            /** Response end_block */
            end_block?: (tendermint.abci.IResponseEndBlock|null);

            /** Response commit */
            commit?: (tendermint.abci.IResponseCommit|null);

            /** Response list_snapshots */
            list_snapshots?: (tendermint.abci.IResponseListSnapshots|null);

            /** Response offer_snapshot */
            offer_snapshot?: (tendermint.abci.IResponseOfferSnapshot|null);

            /** Response load_snapshot_chunk */
            load_snapshot_chunk?: (tendermint.abci.IResponseLoadSnapshotChunk|null);

            /** Response apply_snapshot_chunk */
            apply_snapshot_chunk?: (tendermint.abci.IResponseApplySnapshotChunk|null);
        }

        /** Represents a Response. */
        class Response implements IResponse {

            /**
             * Constructs a new Response.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponse);

            /** Response exception. */
            public exception?: (tendermint.abci.IResponseException|null);

            /** Response echo. */
            public echo?: (tendermint.abci.IResponseEcho|null);

            /** Response flush. */
            public flush?: (tendermint.abci.IResponseFlush|null);

            /** Response info. */
            public info?: (tendermint.abci.IResponseInfo|null);

            /** Response set_option. */
            public set_option?: (tendermint.abci.IResponseSetOption|null);

            /** Response init_chain. */
            public init_chain?: (tendermint.abci.IResponseInitChain|null);

            /** Response query. */
            public query?: (tendermint.abci.IResponseQuery|null);

            /** Response begin_block. */
            public begin_block?: (tendermint.abci.IResponseBeginBlock|null);

            /** Response check_tx. */
            public check_tx?: (tendermint.abci.IResponseCheckTx|null);

            /** Response deliver_tx. */
            public deliver_tx?: (tendermint.abci.IResponseDeliverTx|null);

            /** Response end_block. */
            public end_block?: (tendermint.abci.IResponseEndBlock|null);

            /** Response commit. */
            public commit?: (tendermint.abci.IResponseCommit|null);

            /** Response list_snapshots. */
            public list_snapshots?: (tendermint.abci.IResponseListSnapshots|null);

            /** Response offer_snapshot. */
            public offer_snapshot?: (tendermint.abci.IResponseOfferSnapshot|null);

            /** Response load_snapshot_chunk. */
            public load_snapshot_chunk?: (tendermint.abci.IResponseLoadSnapshotChunk|null);

            /** Response apply_snapshot_chunk. */
            public apply_snapshot_chunk?: (tendermint.abci.IResponseApplySnapshotChunk|null);

            /** Response value. */
            public value?: ("exception"|"echo"|"flush"|"info"|"set_option"|"init_chain"|"query"|"begin_block"|"check_tx"|"deliver_tx"|"end_block"|"commit"|"list_snapshots"|"offer_snapshot"|"load_snapshot_chunk"|"apply_snapshot_chunk");

            /**
             * Encodes the specified Response message. Does not implicitly {@link tendermint.abci.Response.verify|verify} messages.
             * @param message Response message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Response message, length delimited. Does not implicitly {@link tendermint.abci.Response.verify|verify} messages.
             * @param message Response message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Response message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Response
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Response;

            /**
             * Decodes a Response message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Response
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Response;

            /**
             * Verifies a Response message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Response message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Response
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Response;

            /**
             * Creates a plain object from a Response message. Also converts values to other types if specified.
             * @param message Response
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Response to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseException. */
        interface IResponseException {

            /** ResponseException error */
            error?: (string|null);
        }

        /** Represents a ResponseException. */
        class ResponseException implements IResponseException {

            /**
             * Constructs a new ResponseException.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseException);

            /** ResponseException error. */
            public error: string;

            /**
             * Encodes the specified ResponseException message. Does not implicitly {@link tendermint.abci.ResponseException.verify|verify} messages.
             * @param message ResponseException message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseException, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseException message, length delimited. Does not implicitly {@link tendermint.abci.ResponseException.verify|verify} messages.
             * @param message ResponseException message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseException, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseException message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseException
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseException;

            /**
             * Decodes a ResponseException message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseException
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseException;

            /**
             * Verifies a ResponseException message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseException message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseException
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseException;

            /**
             * Creates a plain object from a ResponseException message. Also converts values to other types if specified.
             * @param message ResponseException
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseException, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseException to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseEcho. */
        interface IResponseEcho {

            /** ResponseEcho message */
            message?: (string|null);
        }

        /** Represents a ResponseEcho. */
        class ResponseEcho implements IResponseEcho {

            /**
             * Constructs a new ResponseEcho.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseEcho);

            /** ResponseEcho message. */
            public message: string;

            /**
             * Encodes the specified ResponseEcho message. Does not implicitly {@link tendermint.abci.ResponseEcho.verify|verify} messages.
             * @param message ResponseEcho message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseEcho, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseEcho message, length delimited. Does not implicitly {@link tendermint.abci.ResponseEcho.verify|verify} messages.
             * @param message ResponseEcho message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseEcho, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseEcho message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseEcho
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseEcho;

            /**
             * Decodes a ResponseEcho message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseEcho
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseEcho;

            /**
             * Verifies a ResponseEcho message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseEcho message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseEcho
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseEcho;

            /**
             * Creates a plain object from a ResponseEcho message. Also converts values to other types if specified.
             * @param message ResponseEcho
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseEcho, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseEcho to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseFlush. */
        interface IResponseFlush {
        }

        /** Represents a ResponseFlush. */
        class ResponseFlush implements IResponseFlush {

            /**
             * Constructs a new ResponseFlush.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseFlush);

            /**
             * Encodes the specified ResponseFlush message. Does not implicitly {@link tendermint.abci.ResponseFlush.verify|verify} messages.
             * @param message ResponseFlush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseFlush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseFlush message, length delimited. Does not implicitly {@link tendermint.abci.ResponseFlush.verify|verify} messages.
             * @param message ResponseFlush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseFlush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseFlush message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseFlush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseFlush;

            /**
             * Decodes a ResponseFlush message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseFlush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseFlush;

            /**
             * Verifies a ResponseFlush message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseFlush message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseFlush
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseFlush;

            /**
             * Creates a plain object from a ResponseFlush message. Also converts values to other types if specified.
             * @param message ResponseFlush
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseFlush, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseFlush to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseInfo. */
        interface IResponseInfo {

            /** ResponseInfo data */
            data?: (string|null);

            /** ResponseInfo version */
            version?: (string|null);

            /** ResponseInfo app_version */
            app_version?: (Long|null);

            /** ResponseInfo last_block_height */
            last_block_height?: (Long|null);

            /** ResponseInfo last_block_app_hash */
            last_block_app_hash?: (Uint8Array|null);
        }

        /** Represents a ResponseInfo. */
        class ResponseInfo implements IResponseInfo {

            /**
             * Constructs a new ResponseInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseInfo);

            /** ResponseInfo data. */
            public data: string;

            /** ResponseInfo version. */
            public version: string;

            /** ResponseInfo app_version. */
            public app_version: Long;

            /** ResponseInfo last_block_height. */
            public last_block_height: Long;

            /** ResponseInfo last_block_app_hash. */
            public last_block_app_hash: Uint8Array;

            /**
             * Encodes the specified ResponseInfo message. Does not implicitly {@link tendermint.abci.ResponseInfo.verify|verify} messages.
             * @param message ResponseInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseInfo message, length delimited. Does not implicitly {@link tendermint.abci.ResponseInfo.verify|verify} messages.
             * @param message ResponseInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseInfo;

            /**
             * Decodes a ResponseInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseInfo;

            /**
             * Verifies a ResponseInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseInfo
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseInfo;

            /**
             * Creates a plain object from a ResponseInfo message. Also converts values to other types if specified.
             * @param message ResponseInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseSetOption. */
        interface IResponseSetOption {

            /** ResponseSetOption code */
            code?: (number|null);

            /** ResponseSetOption log */
            log?: (string|null);

            /** ResponseSetOption info */
            info?: (string|null);
        }

        /** Represents a ResponseSetOption. */
        class ResponseSetOption implements IResponseSetOption {

            /**
             * Constructs a new ResponseSetOption.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseSetOption);

            /** ResponseSetOption code. */
            public code: number;

            /** ResponseSetOption log. */
            public log: string;

            /** ResponseSetOption info. */
            public info: string;

            /**
             * Encodes the specified ResponseSetOption message. Does not implicitly {@link tendermint.abci.ResponseSetOption.verify|verify} messages.
             * @param message ResponseSetOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseSetOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseSetOption message, length delimited. Does not implicitly {@link tendermint.abci.ResponseSetOption.verify|verify} messages.
             * @param message ResponseSetOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseSetOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseSetOption message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseSetOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseSetOption;

            /**
             * Decodes a ResponseSetOption message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseSetOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseSetOption;

            /**
             * Verifies a ResponseSetOption message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseSetOption message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseSetOption
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseSetOption;

            /**
             * Creates a plain object from a ResponseSetOption message. Also converts values to other types if specified.
             * @param message ResponseSetOption
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseSetOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseSetOption to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseInitChain. */
        interface IResponseInitChain {

            /** ResponseInitChain consensus_params */
            consensus_params?: (tendermint.abci.IConsensusParams|null);

            /** ResponseInitChain validators */
            validators?: (tendermint.abci.IValidatorUpdate[]|null);

            /** ResponseInitChain app_hash */
            app_hash?: (Uint8Array|null);
        }

        /** Represents a ResponseInitChain. */
        class ResponseInitChain implements IResponseInitChain {

            /**
             * Constructs a new ResponseInitChain.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseInitChain);

            /** ResponseInitChain consensus_params. */
            public consensus_params?: (tendermint.abci.IConsensusParams|null);

            /** ResponseInitChain validators. */
            public validators: tendermint.abci.IValidatorUpdate[];

            /** ResponseInitChain app_hash. */
            public app_hash: Uint8Array;

            /**
             * Encodes the specified ResponseInitChain message. Does not implicitly {@link tendermint.abci.ResponseInitChain.verify|verify} messages.
             * @param message ResponseInitChain message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseInitChain, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseInitChain message, length delimited. Does not implicitly {@link tendermint.abci.ResponseInitChain.verify|verify} messages.
             * @param message ResponseInitChain message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseInitChain, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseInitChain message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseInitChain
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseInitChain;

            /**
             * Decodes a ResponseInitChain message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseInitChain
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseInitChain;

            /**
             * Verifies a ResponseInitChain message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseInitChain message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseInitChain
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseInitChain;

            /**
             * Creates a plain object from a ResponseInitChain message. Also converts values to other types if specified.
             * @param message ResponseInitChain
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseInitChain, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseInitChain to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseQuery. */
        interface IResponseQuery {

            /** ResponseQuery code */
            code?: (number|null);

            /** ResponseQuery log */
            log?: (string|null);

            /** ResponseQuery info */
            info?: (string|null);

            /** ResponseQuery index */
            index?: (Long|null);

            /** ResponseQuery key */
            key?: (Uint8Array|null);

            /** ResponseQuery value */
            value?: (Uint8Array|null);

            /** ResponseQuery proof_ops */
            proof_ops?: (tendermint.crypto.IProofOps|null);

            /** ResponseQuery height */
            height?: (Long|null);

            /** ResponseQuery codespace */
            codespace?: (string|null);
        }

        /** Represents a ResponseQuery. */
        class ResponseQuery implements IResponseQuery {

            /**
             * Constructs a new ResponseQuery.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseQuery);

            /** ResponseQuery code. */
            public code: number;

            /** ResponseQuery log. */
            public log: string;

            /** ResponseQuery info. */
            public info: string;

            /** ResponseQuery index. */
            public index: Long;

            /** ResponseQuery key. */
            public key: Uint8Array;

            /** ResponseQuery value. */
            public value: Uint8Array;

            /** ResponseQuery proof_ops. */
            public proof_ops?: (tendermint.crypto.IProofOps|null);

            /** ResponseQuery height. */
            public height: Long;

            /** ResponseQuery codespace. */
            public codespace: string;

            /**
             * Encodes the specified ResponseQuery message. Does not implicitly {@link tendermint.abci.ResponseQuery.verify|verify} messages.
             * @param message ResponseQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseQuery message, length delimited. Does not implicitly {@link tendermint.abci.ResponseQuery.verify|verify} messages.
             * @param message ResponseQuery message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseQuery, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseQuery message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseQuery;

            /**
             * Decodes a ResponseQuery message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseQuery
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseQuery;

            /**
             * Verifies a ResponseQuery message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseQuery message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseQuery
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseQuery;

            /**
             * Creates a plain object from a ResponseQuery message. Also converts values to other types if specified.
             * @param message ResponseQuery
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseQuery, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseQuery to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseBeginBlock. */
        interface IResponseBeginBlock {

            /** ResponseBeginBlock events */
            events?: (tendermint.abci.IEvent[]|null);
        }

        /** Represents a ResponseBeginBlock. */
        class ResponseBeginBlock implements IResponseBeginBlock {

            /**
             * Constructs a new ResponseBeginBlock.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseBeginBlock);

            /** ResponseBeginBlock events. */
            public events: tendermint.abci.IEvent[];

            /**
             * Encodes the specified ResponseBeginBlock message. Does not implicitly {@link tendermint.abci.ResponseBeginBlock.verify|verify} messages.
             * @param message ResponseBeginBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseBeginBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseBeginBlock message, length delimited. Does not implicitly {@link tendermint.abci.ResponseBeginBlock.verify|verify} messages.
             * @param message ResponseBeginBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseBeginBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseBeginBlock message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseBeginBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseBeginBlock;

            /**
             * Decodes a ResponseBeginBlock message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseBeginBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseBeginBlock;

            /**
             * Verifies a ResponseBeginBlock message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseBeginBlock message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseBeginBlock
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseBeginBlock;

            /**
             * Creates a plain object from a ResponseBeginBlock message. Also converts values to other types if specified.
             * @param message ResponseBeginBlock
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseBeginBlock, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseBeginBlock to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseCheckTx. */
        interface IResponseCheckTx {

            /** ResponseCheckTx code */
            code?: (number|null);

            /** ResponseCheckTx data */
            data?: (Uint8Array|null);

            /** ResponseCheckTx log */
            log?: (string|null);

            /** ResponseCheckTx info */
            info?: (string|null);

            /** ResponseCheckTx gas_wanted */
            gas_wanted?: (Long|null);

            /** ResponseCheckTx gas_used */
            gas_used?: (Long|null);

            /** ResponseCheckTx events */
            events?: (tendermint.abci.IEvent[]|null);

            /** ResponseCheckTx codespace */
            codespace?: (string|null);
        }

        /** Represents a ResponseCheckTx. */
        class ResponseCheckTx implements IResponseCheckTx {

            /**
             * Constructs a new ResponseCheckTx.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseCheckTx);

            /** ResponseCheckTx code. */
            public code: number;

            /** ResponseCheckTx data. */
            public data: Uint8Array;

            /** ResponseCheckTx log. */
            public log: string;

            /** ResponseCheckTx info. */
            public info: string;

            /** ResponseCheckTx gas_wanted. */
            public gas_wanted: Long;

            /** ResponseCheckTx gas_used. */
            public gas_used: Long;

            /** ResponseCheckTx events. */
            public events: tendermint.abci.IEvent[];

            /** ResponseCheckTx codespace. */
            public codespace: string;

            /**
             * Encodes the specified ResponseCheckTx message. Does not implicitly {@link tendermint.abci.ResponseCheckTx.verify|verify} messages.
             * @param message ResponseCheckTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseCheckTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseCheckTx message, length delimited. Does not implicitly {@link tendermint.abci.ResponseCheckTx.verify|verify} messages.
             * @param message ResponseCheckTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseCheckTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseCheckTx message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseCheckTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseCheckTx;

            /**
             * Decodes a ResponseCheckTx message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseCheckTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseCheckTx;

            /**
             * Verifies a ResponseCheckTx message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseCheckTx message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseCheckTx
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseCheckTx;

            /**
             * Creates a plain object from a ResponseCheckTx message. Also converts values to other types if specified.
             * @param message ResponseCheckTx
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseCheckTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseCheckTx to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseDeliverTx. */
        interface IResponseDeliverTx {

            /** ResponseDeliverTx code */
            code?: (number|null);

            /** ResponseDeliverTx data */
            data?: (Uint8Array|null);

            /** ResponseDeliverTx log */
            log?: (string|null);

            /** ResponseDeliverTx info */
            info?: (string|null);

            /** ResponseDeliverTx gas_wanted */
            gas_wanted?: (Long|null);

            /** ResponseDeliverTx gas_used */
            gas_used?: (Long|null);

            /** ResponseDeliverTx events */
            events?: (tendermint.abci.IEvent[]|null);

            /** ResponseDeliverTx codespace */
            codespace?: (string|null);
        }

        /** Represents a ResponseDeliverTx. */
        class ResponseDeliverTx implements IResponseDeliverTx {

            /**
             * Constructs a new ResponseDeliverTx.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseDeliverTx);

            /** ResponseDeliverTx code. */
            public code: number;

            /** ResponseDeliverTx data. */
            public data: Uint8Array;

            /** ResponseDeliverTx log. */
            public log: string;

            /** ResponseDeliverTx info. */
            public info: string;

            /** ResponseDeliverTx gas_wanted. */
            public gas_wanted: Long;

            /** ResponseDeliverTx gas_used. */
            public gas_used: Long;

            /** ResponseDeliverTx events. */
            public events: tendermint.abci.IEvent[];

            /** ResponseDeliverTx codespace. */
            public codespace: string;

            /**
             * Encodes the specified ResponseDeliverTx message. Does not implicitly {@link tendermint.abci.ResponseDeliverTx.verify|verify} messages.
             * @param message ResponseDeliverTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseDeliverTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseDeliverTx message, length delimited. Does not implicitly {@link tendermint.abci.ResponseDeliverTx.verify|verify} messages.
             * @param message ResponseDeliverTx message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseDeliverTx, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseDeliverTx message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseDeliverTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseDeliverTx;

            /**
             * Decodes a ResponseDeliverTx message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseDeliverTx
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseDeliverTx;

            /**
             * Verifies a ResponseDeliverTx message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseDeliverTx message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseDeliverTx
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseDeliverTx;

            /**
             * Creates a plain object from a ResponseDeliverTx message. Also converts values to other types if specified.
             * @param message ResponseDeliverTx
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseDeliverTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseDeliverTx to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseEndBlock. */
        interface IResponseEndBlock {

            /** ResponseEndBlock validator_updates */
            validator_updates?: (tendermint.abci.IValidatorUpdate[]|null);

            /** ResponseEndBlock consensus_param_updates */
            consensus_param_updates?: (tendermint.abci.IConsensusParams|null);

            /** ResponseEndBlock events */
            events?: (tendermint.abci.IEvent[]|null);
        }

        /** Represents a ResponseEndBlock. */
        class ResponseEndBlock implements IResponseEndBlock {

            /**
             * Constructs a new ResponseEndBlock.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseEndBlock);

            /** ResponseEndBlock validator_updates. */
            public validator_updates: tendermint.abci.IValidatorUpdate[];

            /** ResponseEndBlock consensus_param_updates. */
            public consensus_param_updates?: (tendermint.abci.IConsensusParams|null);

            /** ResponseEndBlock events. */
            public events: tendermint.abci.IEvent[];

            /**
             * Encodes the specified ResponseEndBlock message. Does not implicitly {@link tendermint.abci.ResponseEndBlock.verify|verify} messages.
             * @param message ResponseEndBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseEndBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseEndBlock message, length delimited. Does not implicitly {@link tendermint.abci.ResponseEndBlock.verify|verify} messages.
             * @param message ResponseEndBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseEndBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseEndBlock message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseEndBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseEndBlock;

            /**
             * Decodes a ResponseEndBlock message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseEndBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseEndBlock;

            /**
             * Verifies a ResponseEndBlock message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseEndBlock message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseEndBlock
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseEndBlock;

            /**
             * Creates a plain object from a ResponseEndBlock message. Also converts values to other types if specified.
             * @param message ResponseEndBlock
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseEndBlock, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseEndBlock to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseCommit. */
        interface IResponseCommit {

            /** ResponseCommit data */
            data?: (Uint8Array|null);

            /** ResponseCommit retain_height */
            retain_height?: (Long|null);
        }

        /** Represents a ResponseCommit. */
        class ResponseCommit implements IResponseCommit {

            /**
             * Constructs a new ResponseCommit.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseCommit);

            /** ResponseCommit data. */
            public data: Uint8Array;

            /** ResponseCommit retain_height. */
            public retain_height: Long;

            /**
             * Encodes the specified ResponseCommit message. Does not implicitly {@link tendermint.abci.ResponseCommit.verify|verify} messages.
             * @param message ResponseCommit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseCommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseCommit message, length delimited. Does not implicitly {@link tendermint.abci.ResponseCommit.verify|verify} messages.
             * @param message ResponseCommit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseCommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseCommit message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseCommit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseCommit;

            /**
             * Decodes a ResponseCommit message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseCommit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseCommit;

            /**
             * Verifies a ResponseCommit message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseCommit message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseCommit
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseCommit;

            /**
             * Creates a plain object from a ResponseCommit message. Also converts values to other types if specified.
             * @param message ResponseCommit
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseCommit, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseCommit to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseListSnapshots. */
        interface IResponseListSnapshots {

            /** ResponseListSnapshots snapshots */
            snapshots?: (tendermint.abci.ISnapshot[]|null);
        }

        /** Represents a ResponseListSnapshots. */
        class ResponseListSnapshots implements IResponseListSnapshots {

            /**
             * Constructs a new ResponseListSnapshots.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseListSnapshots);

            /** ResponseListSnapshots snapshots. */
            public snapshots: tendermint.abci.ISnapshot[];

            /**
             * Encodes the specified ResponseListSnapshots message. Does not implicitly {@link tendermint.abci.ResponseListSnapshots.verify|verify} messages.
             * @param message ResponseListSnapshots message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseListSnapshots, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseListSnapshots message, length delimited. Does not implicitly {@link tendermint.abci.ResponseListSnapshots.verify|verify} messages.
             * @param message ResponseListSnapshots message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseListSnapshots, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseListSnapshots message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseListSnapshots
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseListSnapshots;

            /**
             * Decodes a ResponseListSnapshots message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseListSnapshots
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseListSnapshots;

            /**
             * Verifies a ResponseListSnapshots message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseListSnapshots message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseListSnapshots
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseListSnapshots;

            /**
             * Creates a plain object from a ResponseListSnapshots message. Also converts values to other types if specified.
             * @param message ResponseListSnapshots
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseListSnapshots, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseListSnapshots to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseOfferSnapshot. */
        interface IResponseOfferSnapshot {

            /** ResponseOfferSnapshot result */
            result?: (tendermint.abci.ResponseOfferSnapshot.Result|null);
        }

        /** Represents a ResponseOfferSnapshot. */
        class ResponseOfferSnapshot implements IResponseOfferSnapshot {

            /**
             * Constructs a new ResponseOfferSnapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseOfferSnapshot);

            /** ResponseOfferSnapshot result. */
            public result: tendermint.abci.ResponseOfferSnapshot.Result;

            /**
             * Encodes the specified ResponseOfferSnapshot message. Does not implicitly {@link tendermint.abci.ResponseOfferSnapshot.verify|verify} messages.
             * @param message ResponseOfferSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseOfferSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseOfferSnapshot message, length delimited. Does not implicitly {@link tendermint.abci.ResponseOfferSnapshot.verify|verify} messages.
             * @param message ResponseOfferSnapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseOfferSnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseOfferSnapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseOfferSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseOfferSnapshot;

            /**
             * Decodes a ResponseOfferSnapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseOfferSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseOfferSnapshot;

            /**
             * Verifies a ResponseOfferSnapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseOfferSnapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseOfferSnapshot
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseOfferSnapshot;

            /**
             * Creates a plain object from a ResponseOfferSnapshot message. Also converts values to other types if specified.
             * @param message ResponseOfferSnapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseOfferSnapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseOfferSnapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace ResponseOfferSnapshot {

            /** Result enum. */
            enum Result {
                UNKNOWN = 0,
                ACCEPT = 1,
                ABORT = 2,
                REJECT = 3,
                REJECT_FORMAT = 4,
                REJECT_SENDER = 5
            }
        }

        /** Properties of a ResponseLoadSnapshotChunk. */
        interface IResponseLoadSnapshotChunk {

            /** ResponseLoadSnapshotChunk chunk */
            chunk?: (Uint8Array|null);
        }

        /** Represents a ResponseLoadSnapshotChunk. */
        class ResponseLoadSnapshotChunk implements IResponseLoadSnapshotChunk {

            /**
             * Constructs a new ResponseLoadSnapshotChunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseLoadSnapshotChunk);

            /** ResponseLoadSnapshotChunk chunk. */
            public chunk: Uint8Array;

            /**
             * Encodes the specified ResponseLoadSnapshotChunk message. Does not implicitly {@link tendermint.abci.ResponseLoadSnapshotChunk.verify|verify} messages.
             * @param message ResponseLoadSnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseLoadSnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseLoadSnapshotChunk message, length delimited. Does not implicitly {@link tendermint.abci.ResponseLoadSnapshotChunk.verify|verify} messages.
             * @param message ResponseLoadSnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseLoadSnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseLoadSnapshotChunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseLoadSnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseLoadSnapshotChunk;

            /**
             * Decodes a ResponseLoadSnapshotChunk message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseLoadSnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseLoadSnapshotChunk;

            /**
             * Verifies a ResponseLoadSnapshotChunk message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseLoadSnapshotChunk message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseLoadSnapshotChunk
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseLoadSnapshotChunk;

            /**
             * Creates a plain object from a ResponseLoadSnapshotChunk message. Also converts values to other types if specified.
             * @param message ResponseLoadSnapshotChunk
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseLoadSnapshotChunk, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseLoadSnapshotChunk to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResponseApplySnapshotChunk. */
        interface IResponseApplySnapshotChunk {

            /** ResponseApplySnapshotChunk result */
            result?: (tendermint.abci.ResponseApplySnapshotChunk.Result|null);

            /** ResponseApplySnapshotChunk refetch_chunks */
            refetch_chunks?: (number[]|null);

            /** ResponseApplySnapshotChunk reject_senders */
            reject_senders?: (string[]|null);
        }

        /** Represents a ResponseApplySnapshotChunk. */
        class ResponseApplySnapshotChunk implements IResponseApplySnapshotChunk {

            /**
             * Constructs a new ResponseApplySnapshotChunk.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IResponseApplySnapshotChunk);

            /** ResponseApplySnapshotChunk result. */
            public result: tendermint.abci.ResponseApplySnapshotChunk.Result;

            /** ResponseApplySnapshotChunk refetch_chunks. */
            public refetch_chunks: number[];

            /** ResponseApplySnapshotChunk reject_senders. */
            public reject_senders: string[];

            /**
             * Encodes the specified ResponseApplySnapshotChunk message. Does not implicitly {@link tendermint.abci.ResponseApplySnapshotChunk.verify|verify} messages.
             * @param message ResponseApplySnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IResponseApplySnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResponseApplySnapshotChunk message, length delimited. Does not implicitly {@link tendermint.abci.ResponseApplySnapshotChunk.verify|verify} messages.
             * @param message ResponseApplySnapshotChunk message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IResponseApplySnapshotChunk, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResponseApplySnapshotChunk message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResponseApplySnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ResponseApplySnapshotChunk;

            /**
             * Decodes a ResponseApplySnapshotChunk message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResponseApplySnapshotChunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ResponseApplySnapshotChunk;

            /**
             * Verifies a ResponseApplySnapshotChunk message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResponseApplySnapshotChunk message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResponseApplySnapshotChunk
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ResponseApplySnapshotChunk;

            /**
             * Creates a plain object from a ResponseApplySnapshotChunk message. Also converts values to other types if specified.
             * @param message ResponseApplySnapshotChunk
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ResponseApplySnapshotChunk, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResponseApplySnapshotChunk to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace ResponseApplySnapshotChunk {

            /** Result enum. */
            enum Result {
                UNKNOWN = 0,
                ACCEPT = 1,
                ABORT = 2,
                RETRY = 3,
                RETRY_SNAPSHOT = 4,
                REJECT_SNAPSHOT = 5
            }
        }

        /** Properties of a ConsensusParams. */
        interface IConsensusParams {

            /** ConsensusParams block */
            block?: (tendermint.abci.IBlockParams|null);

            /** ConsensusParams evidence */
            evidence?: (tendermint.types.IEvidenceParams|null);

            /** ConsensusParams validator */
            validator?: (tendermint.types.IValidatorParams|null);

            /** ConsensusParams version */
            version?: (tendermint.types.IVersionParams|null);
        }

        /** Represents a ConsensusParams. */
        class ConsensusParams implements IConsensusParams {

            /**
             * Constructs a new ConsensusParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IConsensusParams);

            /** ConsensusParams block. */
            public block?: (tendermint.abci.IBlockParams|null);

            /** ConsensusParams evidence. */
            public evidence?: (tendermint.types.IEvidenceParams|null);

            /** ConsensusParams validator. */
            public validator?: (tendermint.types.IValidatorParams|null);

            /** ConsensusParams version. */
            public version?: (tendermint.types.IVersionParams|null);

            /**
             * Encodes the specified ConsensusParams message. Does not implicitly {@link tendermint.abci.ConsensusParams.verify|verify} messages.
             * @param message ConsensusParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IConsensusParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConsensusParams message, length delimited. Does not implicitly {@link tendermint.abci.ConsensusParams.verify|verify} messages.
             * @param message ConsensusParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IConsensusParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConsensusParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConsensusParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ConsensusParams;

            /**
             * Decodes a ConsensusParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConsensusParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ConsensusParams;

            /**
             * Verifies a ConsensusParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConsensusParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConsensusParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ConsensusParams;

            /**
             * Creates a plain object from a ConsensusParams message. Also converts values to other types if specified.
             * @param message ConsensusParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ConsensusParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConsensusParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a BlockParams. */
        interface IBlockParams {

            /** BlockParams max_bytes */
            max_bytes?: (Long|null);

            /** BlockParams max_gas */
            max_gas?: (Long|null);
        }

        /** Represents a BlockParams. */
        class BlockParams implements IBlockParams {

            /**
             * Constructs a new BlockParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IBlockParams);

            /** BlockParams max_bytes. */
            public max_bytes: Long;

            /** BlockParams max_gas. */
            public max_gas: Long;

            /**
             * Encodes the specified BlockParams message. Does not implicitly {@link tendermint.abci.BlockParams.verify|verify} messages.
             * @param message BlockParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IBlockParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockParams message, length delimited. Does not implicitly {@link tendermint.abci.BlockParams.verify|verify} messages.
             * @param message BlockParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IBlockParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.BlockParams;

            /**
             * Decodes a BlockParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.BlockParams;

            /**
             * Verifies a BlockParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.BlockParams;

            /**
             * Creates a plain object from a BlockParams message. Also converts values to other types if specified.
             * @param message BlockParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.BlockParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a LastCommitInfo. */
        interface ILastCommitInfo {

            /** LastCommitInfo round */
            round?: (number|null);

            /** LastCommitInfo votes */
            votes?: (tendermint.abci.IVoteInfo[]|null);
        }

        /** Represents a LastCommitInfo. */
        class LastCommitInfo implements ILastCommitInfo {

            /**
             * Constructs a new LastCommitInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.ILastCommitInfo);

            /** LastCommitInfo round. */
            public round: number;

            /** LastCommitInfo votes. */
            public votes: tendermint.abci.IVoteInfo[];

            /**
             * Encodes the specified LastCommitInfo message. Does not implicitly {@link tendermint.abci.LastCommitInfo.verify|verify} messages.
             * @param message LastCommitInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.ILastCommitInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LastCommitInfo message, length delimited. Does not implicitly {@link tendermint.abci.LastCommitInfo.verify|verify} messages.
             * @param message LastCommitInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.ILastCommitInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LastCommitInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LastCommitInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.LastCommitInfo;

            /**
             * Decodes a LastCommitInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LastCommitInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.LastCommitInfo;

            /**
             * Verifies a LastCommitInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LastCommitInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LastCommitInfo
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.LastCommitInfo;

            /**
             * Creates a plain object from a LastCommitInfo message. Also converts values to other types if specified.
             * @param message LastCommitInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.LastCommitInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LastCommitInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an Event. */
        interface IEvent {

            /** Event type */
            type?: (string|null);

            /** Event attributes */
            attributes?: (tendermint.abci.IEventAttribute[]|null);
        }

        /** Represents an Event. */
        class Event implements IEvent {

            /**
             * Constructs a new Event.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IEvent);

            /** Event type. */
            public type: string;

            /** Event attributes. */
            public attributes: tendermint.abci.IEventAttribute[];

            /**
             * Encodes the specified Event message. Does not implicitly {@link tendermint.abci.Event.verify|verify} messages.
             * @param message Event message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Event message, length delimited. Does not implicitly {@link tendermint.abci.Event.verify|verify} messages.
             * @param message Event message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IEvent, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Event message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Event
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Event;

            /**
             * Decodes an Event message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Event
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Event;

            /**
             * Verifies an Event message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Event message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Event
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Event;

            /**
             * Creates a plain object from an Event message. Also converts values to other types if specified.
             * @param message Event
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Event, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Event to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EventAttribute. */
        interface IEventAttribute {

            /** EventAttribute key */
            key?: (Uint8Array|null);

            /** EventAttribute value */
            value?: (Uint8Array|null);

            /** EventAttribute index */
            index?: (boolean|null);
        }

        /** Represents an EventAttribute. */
        class EventAttribute implements IEventAttribute {

            /**
             * Constructs a new EventAttribute.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IEventAttribute);

            /** EventAttribute key. */
            public key: Uint8Array;

            /** EventAttribute value. */
            public value: Uint8Array;

            /** EventAttribute index. */
            public index: boolean;

            /**
             * Encodes the specified EventAttribute message. Does not implicitly {@link tendermint.abci.EventAttribute.verify|verify} messages.
             * @param message EventAttribute message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IEventAttribute, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EventAttribute message, length delimited. Does not implicitly {@link tendermint.abci.EventAttribute.verify|verify} messages.
             * @param message EventAttribute message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IEventAttribute, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EventAttribute message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EventAttribute
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.EventAttribute;

            /**
             * Decodes an EventAttribute message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EventAttribute
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.EventAttribute;

            /**
             * Verifies an EventAttribute message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EventAttribute message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EventAttribute
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.EventAttribute;

            /**
             * Creates a plain object from an EventAttribute message. Also converts values to other types if specified.
             * @param message EventAttribute
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.EventAttribute, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EventAttribute to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TxResult. */
        interface ITxResult {

            /** TxResult height */
            height?: (Long|null);

            /** TxResult index */
            index?: (number|null);

            /** TxResult tx */
            tx?: (Uint8Array|null);

            /** TxResult result */
            result?: (tendermint.abci.IResponseDeliverTx|null);
        }

        /** Represents a TxResult. */
        class TxResult implements ITxResult {

            /**
             * Constructs a new TxResult.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.ITxResult);

            /** TxResult height. */
            public height: Long;

            /** TxResult index. */
            public index: number;

            /** TxResult tx. */
            public tx: Uint8Array;

            /** TxResult result. */
            public result?: (tendermint.abci.IResponseDeliverTx|null);

            /**
             * Encodes the specified TxResult message. Does not implicitly {@link tendermint.abci.TxResult.verify|verify} messages.
             * @param message TxResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.ITxResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TxResult message, length delimited. Does not implicitly {@link tendermint.abci.TxResult.verify|verify} messages.
             * @param message TxResult message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.ITxResult, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TxResult message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TxResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.TxResult;

            /**
             * Decodes a TxResult message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TxResult
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.TxResult;

            /**
             * Verifies a TxResult message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TxResult message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TxResult
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.TxResult;

            /**
             * Creates a plain object from a TxResult message. Also converts values to other types if specified.
             * @param message TxResult
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.TxResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TxResult to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Validator. */
        interface IValidator {

            /** Validator address */
            address?: (Uint8Array|null);

            /** Validator power */
            power?: (Long|null);
        }

        /** Represents a Validator. */
        class Validator implements IValidator {

            /**
             * Constructs a new Validator.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IValidator);

            /** Validator address. */
            public address: Uint8Array;

            /** Validator power. */
            public power: Long;

            /**
             * Encodes the specified Validator message. Does not implicitly {@link tendermint.abci.Validator.verify|verify} messages.
             * @param message Validator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Validator message, length delimited. Does not implicitly {@link tendermint.abci.Validator.verify|verify} messages.
             * @param message Validator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Validator message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Validator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Validator;

            /**
             * Decodes a Validator message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Validator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Validator;

            /**
             * Verifies a Validator message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Validator message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Validator
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Validator;

            /**
             * Creates a plain object from a Validator message. Also converts values to other types if specified.
             * @param message Validator
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Validator, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Validator to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ValidatorUpdate. */
        interface IValidatorUpdate {

            /** ValidatorUpdate pub_key */
            pub_key?: (tendermint.crypto.IPublicKey|null);

            /** ValidatorUpdate power */
            power?: (Long|null);
        }

        /** Represents a ValidatorUpdate. */
        class ValidatorUpdate implements IValidatorUpdate {

            /**
             * Constructs a new ValidatorUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IValidatorUpdate);

            /** ValidatorUpdate pub_key. */
            public pub_key?: (tendermint.crypto.IPublicKey|null);

            /** ValidatorUpdate power. */
            public power: Long;

            /**
             * Encodes the specified ValidatorUpdate message. Does not implicitly {@link tendermint.abci.ValidatorUpdate.verify|verify} messages.
             * @param message ValidatorUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IValidatorUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ValidatorUpdate message, length delimited. Does not implicitly {@link tendermint.abci.ValidatorUpdate.verify|verify} messages.
             * @param message ValidatorUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IValidatorUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ValidatorUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ValidatorUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.ValidatorUpdate;

            /**
             * Decodes a ValidatorUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ValidatorUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.ValidatorUpdate;

            /**
             * Verifies a ValidatorUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ValidatorUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ValidatorUpdate
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.ValidatorUpdate;

            /**
             * Creates a plain object from a ValidatorUpdate message. Also converts values to other types if specified.
             * @param message ValidatorUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.ValidatorUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ValidatorUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a VoteInfo. */
        interface IVoteInfo {

            /** VoteInfo validator */
            validator?: (tendermint.abci.IValidator|null);

            /** VoteInfo signed_last_block */
            signed_last_block?: (boolean|null);
        }

        /** Represents a VoteInfo. */
        class VoteInfo implements IVoteInfo {

            /**
             * Constructs a new VoteInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IVoteInfo);

            /** VoteInfo validator. */
            public validator?: (tendermint.abci.IValidator|null);

            /** VoteInfo signed_last_block. */
            public signed_last_block: boolean;

            /**
             * Encodes the specified VoteInfo message. Does not implicitly {@link tendermint.abci.VoteInfo.verify|verify} messages.
             * @param message VoteInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IVoteInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified VoteInfo message, length delimited. Does not implicitly {@link tendermint.abci.VoteInfo.verify|verify} messages.
             * @param message VoteInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IVoteInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a VoteInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VoteInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.VoteInfo;

            /**
             * Decodes a VoteInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VoteInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.VoteInfo;

            /**
             * Verifies a VoteInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a VoteInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VoteInfo
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.VoteInfo;

            /**
             * Creates a plain object from a VoteInfo message. Also converts values to other types if specified.
             * @param message VoteInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.VoteInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this VoteInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** EvidenceType enum. */
        enum EvidenceType {
            UNKNOWN = 0,
            DUPLICATE_VOTE = 1,
            LIGHT_CLIENT_ATTACK = 2
        }

        /** Properties of an Evidence. */
        interface IEvidence {

            /** Evidence type */
            type?: (tendermint.abci.EvidenceType|null);

            /** Evidence validator */
            validator?: (tendermint.abci.IValidator|null);

            /** Evidence height */
            height?: (Long|null);

            /** Evidence time */
            time?: (google.protobuf.ITimestamp|null);

            /** Evidence total_voting_power */
            total_voting_power?: (Long|null);
        }

        /** Represents an Evidence. */
        class Evidence implements IEvidence {

            /**
             * Constructs a new Evidence.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.IEvidence);

            /** Evidence type. */
            public type: tendermint.abci.EvidenceType;

            /** Evidence validator. */
            public validator?: (tendermint.abci.IValidator|null);

            /** Evidence height. */
            public height: Long;

            /** Evidence time. */
            public time?: (google.protobuf.ITimestamp|null);

            /** Evidence total_voting_power. */
            public total_voting_power: Long;

            /**
             * Encodes the specified Evidence message. Does not implicitly {@link tendermint.abci.Evidence.verify|verify} messages.
             * @param message Evidence message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.IEvidence, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Evidence message, length delimited. Does not implicitly {@link tendermint.abci.Evidence.verify|verify} messages.
             * @param message Evidence message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.IEvidence, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Evidence message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Evidence
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Evidence;

            /**
             * Decodes an Evidence message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Evidence
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Evidence;

            /**
             * Verifies an Evidence message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Evidence message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Evidence
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Evidence;

            /**
             * Creates a plain object from an Evidence message. Also converts values to other types if specified.
             * @param message Evidence
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Evidence, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Evidence to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Snapshot. */
        interface ISnapshot {

            /** Snapshot height */
            height?: (Long|null);

            /** Snapshot format */
            format?: (number|null);

            /** Snapshot chunks */
            chunks?: (number|null);

            /** Snapshot hash */
            hash?: (Uint8Array|null);

            /** Snapshot metadata */
            metadata?: (Uint8Array|null);
        }

        /** Represents a Snapshot. */
        class Snapshot implements ISnapshot {

            /**
             * Constructs a new Snapshot.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.abci.ISnapshot);

            /** Snapshot height. */
            public height: Long;

            /** Snapshot format. */
            public format: number;

            /** Snapshot chunks. */
            public chunks: number;

            /** Snapshot hash. */
            public hash: Uint8Array;

            /** Snapshot metadata. */
            public metadata: Uint8Array;

            /**
             * Encodes the specified Snapshot message. Does not implicitly {@link tendermint.abci.Snapshot.verify|verify} messages.
             * @param message Snapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.abci.ISnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Snapshot message, length delimited. Does not implicitly {@link tendermint.abci.Snapshot.verify|verify} messages.
             * @param message Snapshot message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.abci.ISnapshot, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Snapshot message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.abci.Snapshot;

            /**
             * Decodes a Snapshot message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Snapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.abci.Snapshot;

            /**
             * Verifies a Snapshot message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Snapshot message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Snapshot
             */
            public static fromObject(object: { [k: string]: any }): tendermint.abci.Snapshot;

            /**
             * Creates a plain object from a Snapshot message. Also converts values to other types if specified.
             * @param message Snapshot
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.abci.Snapshot, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Snapshot to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Represents a ABCIApplication */
        class ABCIApplication extends $protobuf.rpc.Service {

            /**
             * Constructs a new ABCIApplication service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Calls Echo.
             * @param request RequestEcho message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseEcho
             */
            public echo(request: tendermint.abci.IRequestEcho, callback: tendermint.abci.ABCIApplication.EchoCallback): void;

            /**
             * Calls Echo.
             * @param request RequestEcho message or plain object
             * @returns Promise
             */
            public echo(request: tendermint.abci.IRequestEcho): Promise<tendermint.abci.ResponseEcho>;

            /**
             * Calls Flush.
             * @param request RequestFlush message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseFlush
             */
            public flush(request: tendermint.abci.IRequestFlush, callback: tendermint.abci.ABCIApplication.FlushCallback): void;

            /**
             * Calls Flush.
             * @param request RequestFlush message or plain object
             * @returns Promise
             */
            public flush(request: tendermint.abci.IRequestFlush): Promise<tendermint.abci.ResponseFlush>;

            /**
             * Calls Info.
             * @param request RequestInfo message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseInfo
             */
            public info(request: tendermint.abci.IRequestInfo, callback: tendermint.abci.ABCIApplication.InfoCallback): void;

            /**
             * Calls Info.
             * @param request RequestInfo message or plain object
             * @returns Promise
             */
            public info(request: tendermint.abci.IRequestInfo): Promise<tendermint.abci.ResponseInfo>;

            /**
             * Calls SetOption.
             * @param request RequestSetOption message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseSetOption
             */
            public setOption(request: tendermint.abci.IRequestSetOption, callback: tendermint.abci.ABCIApplication.SetOptionCallback): void;

            /**
             * Calls SetOption.
             * @param request RequestSetOption message or plain object
             * @returns Promise
             */
            public setOption(request: tendermint.abci.IRequestSetOption): Promise<tendermint.abci.ResponseSetOption>;

            /**
             * Calls DeliverTx.
             * @param request RequestDeliverTx message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseDeliverTx
             */
            public deliverTx(request: tendermint.abci.IRequestDeliverTx, callback: tendermint.abci.ABCIApplication.DeliverTxCallback): void;

            /**
             * Calls DeliverTx.
             * @param request RequestDeliverTx message or plain object
             * @returns Promise
             */
            public deliverTx(request: tendermint.abci.IRequestDeliverTx): Promise<tendermint.abci.ResponseDeliverTx>;

            /**
             * Calls CheckTx.
             * @param request RequestCheckTx message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseCheckTx
             */
            public checkTx(request: tendermint.abci.IRequestCheckTx, callback: tendermint.abci.ABCIApplication.CheckTxCallback): void;

            /**
             * Calls CheckTx.
             * @param request RequestCheckTx message or plain object
             * @returns Promise
             */
            public checkTx(request: tendermint.abci.IRequestCheckTx): Promise<tendermint.abci.ResponseCheckTx>;

            /**
             * Calls Query.
             * @param request RequestQuery message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseQuery
             */
            public query(request: tendermint.abci.IRequestQuery, callback: tendermint.abci.ABCIApplication.QueryCallback): void;

            /**
             * Calls Query.
             * @param request RequestQuery message or plain object
             * @returns Promise
             */
            public query(request: tendermint.abci.IRequestQuery): Promise<tendermint.abci.ResponseQuery>;

            /**
             * Calls Commit.
             * @param request RequestCommit message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseCommit
             */
            public commit(request: tendermint.abci.IRequestCommit, callback: tendermint.abci.ABCIApplication.CommitCallback): void;

            /**
             * Calls Commit.
             * @param request RequestCommit message or plain object
             * @returns Promise
             */
            public commit(request: tendermint.abci.IRequestCommit): Promise<tendermint.abci.ResponseCommit>;

            /**
             * Calls InitChain.
             * @param request RequestInitChain message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseInitChain
             */
            public initChain(request: tendermint.abci.IRequestInitChain, callback: tendermint.abci.ABCIApplication.InitChainCallback): void;

            /**
             * Calls InitChain.
             * @param request RequestInitChain message or plain object
             * @returns Promise
             */
            public initChain(request: tendermint.abci.IRequestInitChain): Promise<tendermint.abci.ResponseInitChain>;

            /**
             * Calls BeginBlock.
             * @param request RequestBeginBlock message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseBeginBlock
             */
            public beginBlock(request: tendermint.abci.IRequestBeginBlock, callback: tendermint.abci.ABCIApplication.BeginBlockCallback): void;

            /**
             * Calls BeginBlock.
             * @param request RequestBeginBlock message or plain object
             * @returns Promise
             */
            public beginBlock(request: tendermint.abci.IRequestBeginBlock): Promise<tendermint.abci.ResponseBeginBlock>;

            /**
             * Calls EndBlock.
             * @param request RequestEndBlock message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseEndBlock
             */
            public endBlock(request: tendermint.abci.IRequestEndBlock, callback: tendermint.abci.ABCIApplication.EndBlockCallback): void;

            /**
             * Calls EndBlock.
             * @param request RequestEndBlock message or plain object
             * @returns Promise
             */
            public endBlock(request: tendermint.abci.IRequestEndBlock): Promise<tendermint.abci.ResponseEndBlock>;

            /**
             * Calls ListSnapshots.
             * @param request RequestListSnapshots message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseListSnapshots
             */
            public listSnapshots(request: tendermint.abci.IRequestListSnapshots, callback: tendermint.abci.ABCIApplication.ListSnapshotsCallback): void;

            /**
             * Calls ListSnapshots.
             * @param request RequestListSnapshots message or plain object
             * @returns Promise
             */
            public listSnapshots(request: tendermint.abci.IRequestListSnapshots): Promise<tendermint.abci.ResponseListSnapshots>;

            /**
             * Calls OfferSnapshot.
             * @param request RequestOfferSnapshot message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseOfferSnapshot
             */
            public offerSnapshot(request: tendermint.abci.IRequestOfferSnapshot, callback: tendermint.abci.ABCIApplication.OfferSnapshotCallback): void;

            /**
             * Calls OfferSnapshot.
             * @param request RequestOfferSnapshot message or plain object
             * @returns Promise
             */
            public offerSnapshot(request: tendermint.abci.IRequestOfferSnapshot): Promise<tendermint.abci.ResponseOfferSnapshot>;

            /**
             * Calls LoadSnapshotChunk.
             * @param request RequestLoadSnapshotChunk message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseLoadSnapshotChunk
             */
            public loadSnapshotChunk(request: tendermint.abci.IRequestLoadSnapshotChunk, callback: tendermint.abci.ABCIApplication.LoadSnapshotChunkCallback): void;

            /**
             * Calls LoadSnapshotChunk.
             * @param request RequestLoadSnapshotChunk message or plain object
             * @returns Promise
             */
            public loadSnapshotChunk(request: tendermint.abci.IRequestLoadSnapshotChunk): Promise<tendermint.abci.ResponseLoadSnapshotChunk>;

            /**
             * Calls ApplySnapshotChunk.
             * @param request RequestApplySnapshotChunk message or plain object
             * @param callback Node-style callback called with the error, if any, and ResponseApplySnapshotChunk
             */
            public applySnapshotChunk(request: tendermint.abci.IRequestApplySnapshotChunk, callback: tendermint.abci.ABCIApplication.ApplySnapshotChunkCallback): void;

            /**
             * Calls ApplySnapshotChunk.
             * @param request RequestApplySnapshotChunk message or plain object
             * @returns Promise
             */
            public applySnapshotChunk(request: tendermint.abci.IRequestApplySnapshotChunk): Promise<tendermint.abci.ResponseApplySnapshotChunk>;
        }

        namespace ABCIApplication {

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#echo}.
             * @param error Error, if any
             * @param [response] ResponseEcho
             */
            type EchoCallback = (error: (Error|null), response?: tendermint.abci.ResponseEcho) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#flush}.
             * @param error Error, if any
             * @param [response] ResponseFlush
             */
            type FlushCallback = (error: (Error|null), response?: tendermint.abci.ResponseFlush) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#info}.
             * @param error Error, if any
             * @param [response] ResponseInfo
             */
            type InfoCallback = (error: (Error|null), response?: tendermint.abci.ResponseInfo) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#setOption}.
             * @param error Error, if any
             * @param [response] ResponseSetOption
             */
            type SetOptionCallback = (error: (Error|null), response?: tendermint.abci.ResponseSetOption) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#deliverTx}.
             * @param error Error, if any
             * @param [response] ResponseDeliverTx
             */
            type DeliverTxCallback = (error: (Error|null), response?: tendermint.abci.ResponseDeliverTx) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#checkTx}.
             * @param error Error, if any
             * @param [response] ResponseCheckTx
             */
            type CheckTxCallback = (error: (Error|null), response?: tendermint.abci.ResponseCheckTx) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#query}.
             * @param error Error, if any
             * @param [response] ResponseQuery
             */
            type QueryCallback = (error: (Error|null), response?: tendermint.abci.ResponseQuery) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#commit}.
             * @param error Error, if any
             * @param [response] ResponseCommit
             */
            type CommitCallback = (error: (Error|null), response?: tendermint.abci.ResponseCommit) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#initChain}.
             * @param error Error, if any
             * @param [response] ResponseInitChain
             */
            type InitChainCallback = (error: (Error|null), response?: tendermint.abci.ResponseInitChain) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#beginBlock}.
             * @param error Error, if any
             * @param [response] ResponseBeginBlock
             */
            type BeginBlockCallback = (error: (Error|null), response?: tendermint.abci.ResponseBeginBlock) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#endBlock}.
             * @param error Error, if any
             * @param [response] ResponseEndBlock
             */
            type EndBlockCallback = (error: (Error|null), response?: tendermint.abci.ResponseEndBlock) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#listSnapshots}.
             * @param error Error, if any
             * @param [response] ResponseListSnapshots
             */
            type ListSnapshotsCallback = (error: (Error|null), response?: tendermint.abci.ResponseListSnapshots) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#offerSnapshot}.
             * @param error Error, if any
             * @param [response] ResponseOfferSnapshot
             */
            type OfferSnapshotCallback = (error: (Error|null), response?: tendermint.abci.ResponseOfferSnapshot) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#loadSnapshotChunk}.
             * @param error Error, if any
             * @param [response] ResponseLoadSnapshotChunk
             */
            type LoadSnapshotChunkCallback = (error: (Error|null), response?: tendermint.abci.ResponseLoadSnapshotChunk) => void;

            /**
             * Callback as used by {@link tendermint.abci.ABCIApplication#applySnapshotChunk}.
             * @param error Error, if any
             * @param [response] ResponseApplySnapshotChunk
             */
            type ApplySnapshotChunkCallback = (error: (Error|null), response?: tendermint.abci.ResponseApplySnapshotChunk) => void;
        }
    }

    /** Namespace types. */
    namespace types {

        /** BlockIDFlag enum. */
        enum BlockIDFlag {
            BLOCK_ID_FLAG_UNKNOWN = 0,
            BLOCK_ID_FLAG_ABSENT = 1,
            BLOCK_ID_FLAG_COMMIT = 2,
            BLOCK_ID_FLAG_NIL = 3
        }

        /** SignedMsgType enum. */
        enum SignedMsgType {
            SIGNED_MSG_TYPE_UNKNOWN = 0,
            SIGNED_MSG_TYPE_PREVOTE = 1,
            SIGNED_MSG_TYPE_PRECOMMIT = 2,
            SIGNED_MSG_TYPE_PROPOSAL = 32
        }

        /** Properties of a PartSetHeader. */
        interface IPartSetHeader {

            /** PartSetHeader total */
            total?: (number|null);

            /** PartSetHeader hash */
            hash?: (Uint8Array|null);
        }

        /** Represents a PartSetHeader. */
        class PartSetHeader implements IPartSetHeader {

            /**
             * Constructs a new PartSetHeader.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IPartSetHeader);

            /** PartSetHeader total. */
            public total: number;

            /** PartSetHeader hash. */
            public hash: Uint8Array;

            /**
             * Encodes the specified PartSetHeader message. Does not implicitly {@link tendermint.types.PartSetHeader.verify|verify} messages.
             * @param message PartSetHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IPartSetHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PartSetHeader message, length delimited. Does not implicitly {@link tendermint.types.PartSetHeader.verify|verify} messages.
             * @param message PartSetHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IPartSetHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PartSetHeader message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PartSetHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.PartSetHeader;

            /**
             * Decodes a PartSetHeader message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PartSetHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.PartSetHeader;

            /**
             * Verifies a PartSetHeader message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PartSetHeader message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PartSetHeader
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.PartSetHeader;

            /**
             * Creates a plain object from a PartSetHeader message. Also converts values to other types if specified.
             * @param message PartSetHeader
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.PartSetHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PartSetHeader to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Part. */
        interface IPart {

            /** Part index */
            index?: (number|null);

            /** Part bytes */
            bytes?: (Uint8Array|null);

            /** Part proof */
            proof?: (tendermint.crypto.IProof|null);
        }

        /** Represents a Part. */
        class Part implements IPart {

            /**
             * Constructs a new Part.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IPart);

            /** Part index. */
            public index: number;

            /** Part bytes. */
            public bytes: Uint8Array;

            /** Part proof. */
            public proof?: (tendermint.crypto.IProof|null);

            /**
             * Encodes the specified Part message. Does not implicitly {@link tendermint.types.Part.verify|verify} messages.
             * @param message Part message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IPart, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Part message, length delimited. Does not implicitly {@link tendermint.types.Part.verify|verify} messages.
             * @param message Part message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IPart, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Part message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Part
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Part;

            /**
             * Decodes a Part message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Part
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Part;

            /**
             * Verifies a Part message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Part message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Part
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Part;

            /**
             * Creates a plain object from a Part message. Also converts values to other types if specified.
             * @param message Part
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Part, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Part to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a BlockID. */
        interface IBlockID {

            /** BlockID hash */
            hash?: (Uint8Array|null);

            /** BlockID part_set_header */
            part_set_header?: (tendermint.types.IPartSetHeader|null);
        }

        /** Represents a BlockID. */
        class BlockID implements IBlockID {

            /**
             * Constructs a new BlockID.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IBlockID);

            /** BlockID hash. */
            public hash: Uint8Array;

            /** BlockID part_set_header. */
            public part_set_header?: (tendermint.types.IPartSetHeader|null);

            /**
             * Encodes the specified BlockID message. Does not implicitly {@link tendermint.types.BlockID.verify|verify} messages.
             * @param message BlockID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IBlockID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockID message, length delimited. Does not implicitly {@link tendermint.types.BlockID.verify|verify} messages.
             * @param message BlockID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IBlockID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockID message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.BlockID;

            /**
             * Decodes a BlockID message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.BlockID;

            /**
             * Verifies a BlockID message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockID message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockID
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.BlockID;

            /**
             * Creates a plain object from a BlockID message. Also converts values to other types if specified.
             * @param message BlockID
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.BlockID, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockID to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Header. */
        interface IHeader {

            /** Header version */
            version?: (tendermint.version.IConsensus|null);

            /** Header chain_id */
            chain_id?: (string|null);

            /** Header height */
            height?: (Long|null);

            /** Header time */
            time?: (google.protobuf.ITimestamp|null);

            /** Header last_block_id */
            last_block_id?: (tendermint.types.IBlockID|null);

            /** Header last_commit_hash */
            last_commit_hash?: (Uint8Array|null);

            /** Header data_hash */
            data_hash?: (Uint8Array|null);

            /** Header validators_hash */
            validators_hash?: (Uint8Array|null);

            /** Header next_validators_hash */
            next_validators_hash?: (Uint8Array|null);

            /** Header consensus_hash */
            consensus_hash?: (Uint8Array|null);

            /** Header app_hash */
            app_hash?: (Uint8Array|null);

            /** Header last_results_hash */
            last_results_hash?: (Uint8Array|null);

            /** Header evidence_hash */
            evidence_hash?: (Uint8Array|null);

            /** Header proposer_address */
            proposer_address?: (Uint8Array|null);
        }

        /** Represents a Header. */
        class Header implements IHeader {

            /**
             * Constructs a new Header.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IHeader);

            /** Header version. */
            public version?: (tendermint.version.IConsensus|null);

            /** Header chain_id. */
            public chain_id: string;

            /** Header height. */
            public height: Long;

            /** Header time. */
            public time?: (google.protobuf.ITimestamp|null);

            /** Header last_block_id. */
            public last_block_id?: (tendermint.types.IBlockID|null);

            /** Header last_commit_hash. */
            public last_commit_hash: Uint8Array;

            /** Header data_hash. */
            public data_hash: Uint8Array;

            /** Header validators_hash. */
            public validators_hash: Uint8Array;

            /** Header next_validators_hash. */
            public next_validators_hash: Uint8Array;

            /** Header consensus_hash. */
            public consensus_hash: Uint8Array;

            /** Header app_hash. */
            public app_hash: Uint8Array;

            /** Header last_results_hash. */
            public last_results_hash: Uint8Array;

            /** Header evidence_hash. */
            public evidence_hash: Uint8Array;

            /** Header proposer_address. */
            public proposer_address: Uint8Array;

            /**
             * Encodes the specified Header message. Does not implicitly {@link tendermint.types.Header.verify|verify} messages.
             * @param message Header message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Header message, length delimited. Does not implicitly {@link tendermint.types.Header.verify|verify} messages.
             * @param message Header message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Header message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Header
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Header;

            /**
             * Decodes a Header message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Header
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Header;

            /**
             * Verifies a Header message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Header message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Header
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Header;

            /**
             * Creates a plain object from a Header message. Also converts values to other types if specified.
             * @param message Header
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Header, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Header to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Data. */
        interface IData {

            /** Data txs */
            txs?: (Uint8Array[]|null);
        }

        /** Represents a Data. */
        class Data implements IData {

            /**
             * Constructs a new Data.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IData);

            /** Data txs. */
            public txs: Uint8Array[];

            /**
             * Encodes the specified Data message. Does not implicitly {@link tendermint.types.Data.verify|verify} messages.
             * @param message Data message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Data message, length delimited. Does not implicitly {@link tendermint.types.Data.verify|verify} messages.
             * @param message Data message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IData, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Data message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Data
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Data;

            /**
             * Decodes a Data message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Data
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Data;

            /**
             * Verifies a Data message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Data message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Data
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Data;

            /**
             * Creates a plain object from a Data message. Also converts values to other types if specified.
             * @param message Data
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Data, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Data to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Vote. */
        interface IVote {

            /** Vote type */
            type?: (tendermint.types.SignedMsgType|null);

            /** Vote height */
            height?: (Long|null);

            /** Vote round */
            round?: (number|null);

            /** Vote block_id */
            block_id?: (tendermint.types.IBlockID|null);

            /** Vote timestamp */
            timestamp?: (google.protobuf.ITimestamp|null);

            /** Vote validator_address */
            validator_address?: (Uint8Array|null);

            /** Vote validator_index */
            validator_index?: (number|null);

            /** Vote signature */
            signature?: (Uint8Array|null);
        }

        /** Represents a Vote. */
        class Vote implements IVote {

            /**
             * Constructs a new Vote.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IVote);

            /** Vote type. */
            public type: tendermint.types.SignedMsgType;

            /** Vote height. */
            public height: Long;

            /** Vote round. */
            public round: number;

            /** Vote block_id. */
            public block_id?: (tendermint.types.IBlockID|null);

            /** Vote timestamp. */
            public timestamp?: (google.protobuf.ITimestamp|null);

            /** Vote validator_address. */
            public validator_address: Uint8Array;

            /** Vote validator_index. */
            public validator_index: number;

            /** Vote signature. */
            public signature: Uint8Array;

            /**
             * Encodes the specified Vote message. Does not implicitly {@link tendermint.types.Vote.verify|verify} messages.
             * @param message Vote message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Vote message, length delimited. Does not implicitly {@link tendermint.types.Vote.verify|verify} messages.
             * @param message Vote message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Vote message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Vote
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Vote;

            /**
             * Decodes a Vote message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Vote
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Vote;

            /**
             * Verifies a Vote message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Vote message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Vote
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Vote;

            /**
             * Creates a plain object from a Vote message. Also converts values to other types if specified.
             * @param message Vote
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Vote, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Vote to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Commit. */
        interface ICommit {

            /** Commit height */
            height?: (Long|null);

            /** Commit round */
            round?: (number|null);

            /** Commit block_id */
            block_id?: (tendermint.types.IBlockID|null);

            /** Commit signatures */
            signatures?: (tendermint.types.ICommitSig[]|null);
        }

        /** Represents a Commit. */
        class Commit implements ICommit {

            /**
             * Constructs a new Commit.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ICommit);

            /** Commit height. */
            public height: Long;

            /** Commit round. */
            public round: number;

            /** Commit block_id. */
            public block_id?: (tendermint.types.IBlockID|null);

            /** Commit signatures. */
            public signatures: tendermint.types.ICommitSig[];

            /**
             * Encodes the specified Commit message. Does not implicitly {@link tendermint.types.Commit.verify|verify} messages.
             * @param message Commit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ICommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Commit message, length delimited. Does not implicitly {@link tendermint.types.Commit.verify|verify} messages.
             * @param message Commit message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ICommit, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Commit message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Commit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Commit;

            /**
             * Decodes a Commit message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Commit
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Commit;

            /**
             * Verifies a Commit message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Commit message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Commit
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Commit;

            /**
             * Creates a plain object from a Commit message. Also converts values to other types if specified.
             * @param message Commit
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Commit, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Commit to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CommitSig. */
        interface ICommitSig {

            /** CommitSig block_id_flag */
            block_id_flag?: (tendermint.types.BlockIDFlag|null);

            /** CommitSig validator_address */
            validator_address?: (Uint8Array|null);

            /** CommitSig timestamp */
            timestamp?: (google.protobuf.ITimestamp|null);

            /** CommitSig signature */
            signature?: (Uint8Array|null);
        }

        /** Represents a CommitSig. */
        class CommitSig implements ICommitSig {

            /**
             * Constructs a new CommitSig.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ICommitSig);

            /** CommitSig block_id_flag. */
            public block_id_flag: tendermint.types.BlockIDFlag;

            /** CommitSig validator_address. */
            public validator_address: Uint8Array;

            /** CommitSig timestamp. */
            public timestamp?: (google.protobuf.ITimestamp|null);

            /** CommitSig signature. */
            public signature: Uint8Array;

            /**
             * Encodes the specified CommitSig message. Does not implicitly {@link tendermint.types.CommitSig.verify|verify} messages.
             * @param message CommitSig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ICommitSig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CommitSig message, length delimited. Does not implicitly {@link tendermint.types.CommitSig.verify|verify} messages.
             * @param message CommitSig message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ICommitSig, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CommitSig message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CommitSig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.CommitSig;

            /**
             * Decodes a CommitSig message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CommitSig
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.CommitSig;

            /**
             * Verifies a CommitSig message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CommitSig message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CommitSig
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.CommitSig;

            /**
             * Creates a plain object from a CommitSig message. Also converts values to other types if specified.
             * @param message CommitSig
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.CommitSig, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CommitSig to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Proposal. */
        interface IProposal {

            /** Proposal type */
            type?: (tendermint.types.SignedMsgType|null);

            /** Proposal height */
            height?: (Long|null);

            /** Proposal round */
            round?: (number|null);

            /** Proposal pol_round */
            pol_round?: (number|null);

            /** Proposal block_id */
            block_id?: (tendermint.types.IBlockID|null);

            /** Proposal timestamp */
            timestamp?: (google.protobuf.ITimestamp|null);

            /** Proposal signature */
            signature?: (Uint8Array|null);
        }

        /** Represents a Proposal. */
        class Proposal implements IProposal {

            /**
             * Constructs a new Proposal.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IProposal);

            /** Proposal type. */
            public type: tendermint.types.SignedMsgType;

            /** Proposal height. */
            public height: Long;

            /** Proposal round. */
            public round: number;

            /** Proposal pol_round. */
            public pol_round: number;

            /** Proposal block_id. */
            public block_id?: (tendermint.types.IBlockID|null);

            /** Proposal timestamp. */
            public timestamp?: (google.protobuf.ITimestamp|null);

            /** Proposal signature. */
            public signature: Uint8Array;

            /**
             * Encodes the specified Proposal message. Does not implicitly {@link tendermint.types.Proposal.verify|verify} messages.
             * @param message Proposal message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Proposal message, length delimited. Does not implicitly {@link tendermint.types.Proposal.verify|verify} messages.
             * @param message Proposal message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Proposal message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Proposal
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Proposal;

            /**
             * Decodes a Proposal message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Proposal
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Proposal;

            /**
             * Verifies a Proposal message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Proposal message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Proposal
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Proposal;

            /**
             * Creates a plain object from a Proposal message. Also converts values to other types if specified.
             * @param message Proposal
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Proposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Proposal to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a SignedHeader. */
        interface ISignedHeader {

            /** SignedHeader header */
            header?: (tendermint.types.IHeader|null);

            /** SignedHeader commit */
            commit?: (tendermint.types.ICommit|null);
        }

        /** Represents a SignedHeader. */
        class SignedHeader implements ISignedHeader {

            /**
             * Constructs a new SignedHeader.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ISignedHeader);

            /** SignedHeader header. */
            public header?: (tendermint.types.IHeader|null);

            /** SignedHeader commit. */
            public commit?: (tendermint.types.ICommit|null);

            /**
             * Encodes the specified SignedHeader message. Does not implicitly {@link tendermint.types.SignedHeader.verify|verify} messages.
             * @param message SignedHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ISignedHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SignedHeader message, length delimited. Does not implicitly {@link tendermint.types.SignedHeader.verify|verify} messages.
             * @param message SignedHeader message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ISignedHeader, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignedHeader message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SignedHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.SignedHeader;

            /**
             * Decodes a SignedHeader message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SignedHeader
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.SignedHeader;

            /**
             * Verifies a SignedHeader message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SignedHeader message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SignedHeader
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.SignedHeader;

            /**
             * Creates a plain object from a SignedHeader message. Also converts values to other types if specified.
             * @param message SignedHeader
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.SignedHeader, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SignedHeader to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a LightBlock. */
        interface ILightBlock {

            /** LightBlock signed_header */
            signed_header?: (tendermint.types.ISignedHeader|null);

            /** LightBlock validator_set */
            validator_set?: (tendermint.types.IValidatorSet|null);
        }

        /** Represents a LightBlock. */
        class LightBlock implements ILightBlock {

            /**
             * Constructs a new LightBlock.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ILightBlock);

            /** LightBlock signed_header. */
            public signed_header?: (tendermint.types.ISignedHeader|null);

            /** LightBlock validator_set. */
            public validator_set?: (tendermint.types.IValidatorSet|null);

            /**
             * Encodes the specified LightBlock message. Does not implicitly {@link tendermint.types.LightBlock.verify|verify} messages.
             * @param message LightBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ILightBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LightBlock message, length delimited. Does not implicitly {@link tendermint.types.LightBlock.verify|verify} messages.
             * @param message LightBlock message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ILightBlock, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LightBlock message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LightBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.LightBlock;

            /**
             * Decodes a LightBlock message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LightBlock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.LightBlock;

            /**
             * Verifies a LightBlock message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LightBlock message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LightBlock
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.LightBlock;

            /**
             * Creates a plain object from a LightBlock message. Also converts values to other types if specified.
             * @param message LightBlock
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.LightBlock, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LightBlock to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a BlockMeta. */
        interface IBlockMeta {

            /** BlockMeta block_id */
            block_id?: (tendermint.types.IBlockID|null);

            /** BlockMeta block_size */
            block_size?: (Long|null);

            /** BlockMeta header */
            header?: (tendermint.types.IHeader|null);

            /** BlockMeta num_txs */
            num_txs?: (Long|null);
        }

        /** Represents a BlockMeta. */
        class BlockMeta implements IBlockMeta {

            /**
             * Constructs a new BlockMeta.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IBlockMeta);

            /** BlockMeta block_id. */
            public block_id?: (tendermint.types.IBlockID|null);

            /** BlockMeta block_size. */
            public block_size: Long;

            /** BlockMeta header. */
            public header?: (tendermint.types.IHeader|null);

            /** BlockMeta num_txs. */
            public num_txs: Long;

            /**
             * Encodes the specified BlockMeta message. Does not implicitly {@link tendermint.types.BlockMeta.verify|verify} messages.
             * @param message BlockMeta message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IBlockMeta, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockMeta message, length delimited. Does not implicitly {@link tendermint.types.BlockMeta.verify|verify} messages.
             * @param message BlockMeta message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IBlockMeta, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockMeta message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockMeta
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.BlockMeta;

            /**
             * Decodes a BlockMeta message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockMeta
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.BlockMeta;

            /**
             * Verifies a BlockMeta message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockMeta message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockMeta
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.BlockMeta;

            /**
             * Creates a plain object from a BlockMeta message. Also converts values to other types if specified.
             * @param message BlockMeta
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.BlockMeta, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockMeta to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TxProof. */
        interface ITxProof {

            /** TxProof root_hash */
            root_hash?: (Uint8Array|null);

            /** TxProof data */
            data?: (Uint8Array|null);

            /** TxProof proof */
            proof?: (tendermint.crypto.IProof|null);
        }

        /** Represents a TxProof. */
        class TxProof implements ITxProof {

            /**
             * Constructs a new TxProof.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ITxProof);

            /** TxProof root_hash. */
            public root_hash: Uint8Array;

            /** TxProof data. */
            public data: Uint8Array;

            /** TxProof proof. */
            public proof?: (tendermint.crypto.IProof|null);

            /**
             * Encodes the specified TxProof message. Does not implicitly {@link tendermint.types.TxProof.verify|verify} messages.
             * @param message TxProof message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ITxProof, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TxProof message, length delimited. Does not implicitly {@link tendermint.types.TxProof.verify|verify} messages.
             * @param message TxProof message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ITxProof, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TxProof message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TxProof
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.TxProof;

            /**
             * Decodes a TxProof message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TxProof
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.TxProof;

            /**
             * Verifies a TxProof message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TxProof message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TxProof
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.TxProof;

            /**
             * Creates a plain object from a TxProof message. Also converts values to other types if specified.
             * @param message TxProof
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.TxProof, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TxProof to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ValidatorSet. */
        interface IValidatorSet {

            /** ValidatorSet validators */
            validators?: (tendermint.types.IValidator[]|null);

            /** ValidatorSet proposer */
            proposer?: (tendermint.types.IValidator|null);

            /** ValidatorSet total_voting_power */
            total_voting_power?: (Long|null);
        }

        /** Represents a ValidatorSet. */
        class ValidatorSet implements IValidatorSet {

            /**
             * Constructs a new ValidatorSet.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IValidatorSet);

            /** ValidatorSet validators. */
            public validators: tendermint.types.IValidator[];

            /** ValidatorSet proposer. */
            public proposer?: (tendermint.types.IValidator|null);

            /** ValidatorSet total_voting_power. */
            public total_voting_power: Long;

            /**
             * Encodes the specified ValidatorSet message. Does not implicitly {@link tendermint.types.ValidatorSet.verify|verify} messages.
             * @param message ValidatorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IValidatorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ValidatorSet message, length delimited. Does not implicitly {@link tendermint.types.ValidatorSet.verify|verify} messages.
             * @param message ValidatorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IValidatorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ValidatorSet message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ValidatorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.ValidatorSet;

            /**
             * Decodes a ValidatorSet message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ValidatorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.ValidatorSet;

            /**
             * Verifies a ValidatorSet message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ValidatorSet message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ValidatorSet
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.ValidatorSet;

            /**
             * Creates a plain object from a ValidatorSet message. Also converts values to other types if specified.
             * @param message ValidatorSet
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.ValidatorSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ValidatorSet to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Validator. */
        interface IValidator {

            /** Validator address */
            address?: (Uint8Array|null);

            /** Validator pub_key */
            pub_key?: (tendermint.crypto.IPublicKey|null);

            /** Validator voting_power */
            voting_power?: (Long|null);

            /** Validator proposer_priority */
            proposer_priority?: (Long|null);
        }

        /** Represents a Validator. */
        class Validator implements IValidator {

            /**
             * Constructs a new Validator.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IValidator);

            /** Validator address. */
            public address: Uint8Array;

            /** Validator pub_key. */
            public pub_key?: (tendermint.crypto.IPublicKey|null);

            /** Validator voting_power. */
            public voting_power: Long;

            /** Validator proposer_priority. */
            public proposer_priority: Long;

            /**
             * Encodes the specified Validator message. Does not implicitly {@link tendermint.types.Validator.verify|verify} messages.
             * @param message Validator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Validator message, length delimited. Does not implicitly {@link tendermint.types.Validator.verify|verify} messages.
             * @param message Validator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Validator message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Validator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.Validator;

            /**
             * Decodes a Validator message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Validator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.Validator;

            /**
             * Verifies a Validator message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Validator message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Validator
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.Validator;

            /**
             * Creates a plain object from a Validator message. Also converts values to other types if specified.
             * @param message Validator
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.Validator, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Validator to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a SimpleValidator. */
        interface ISimpleValidator {

            /** SimpleValidator pub_key */
            pub_key?: (tendermint.crypto.IPublicKey|null);

            /** SimpleValidator voting_power */
            voting_power?: (Long|null);
        }

        /** Represents a SimpleValidator. */
        class SimpleValidator implements ISimpleValidator {

            /**
             * Constructs a new SimpleValidator.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.ISimpleValidator);

            /** SimpleValidator pub_key. */
            public pub_key?: (tendermint.crypto.IPublicKey|null);

            /** SimpleValidator voting_power. */
            public voting_power: Long;

            /**
             * Encodes the specified SimpleValidator message. Does not implicitly {@link tendermint.types.SimpleValidator.verify|verify} messages.
             * @param message SimpleValidator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.ISimpleValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SimpleValidator message, length delimited. Does not implicitly {@link tendermint.types.SimpleValidator.verify|verify} messages.
             * @param message SimpleValidator message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.ISimpleValidator, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SimpleValidator message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SimpleValidator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.SimpleValidator;

            /**
             * Decodes a SimpleValidator message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SimpleValidator
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.SimpleValidator;

            /**
             * Verifies a SimpleValidator message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SimpleValidator message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SimpleValidator
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.SimpleValidator;

            /**
             * Creates a plain object from a SimpleValidator message. Also converts values to other types if specified.
             * @param message SimpleValidator
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.SimpleValidator, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SimpleValidator to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ConsensusParams. */
        interface IConsensusParams {

            /** ConsensusParams block */
            block?: (tendermint.types.IBlockParams|null);

            /** ConsensusParams evidence */
            evidence?: (tendermint.types.IEvidenceParams|null);

            /** ConsensusParams validator */
            validator?: (tendermint.types.IValidatorParams|null);

            /** ConsensusParams version */
            version?: (tendermint.types.IVersionParams|null);
        }

        /** Represents a ConsensusParams. */
        class ConsensusParams implements IConsensusParams {

            /**
             * Constructs a new ConsensusParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IConsensusParams);

            /** ConsensusParams block. */
            public block?: (tendermint.types.IBlockParams|null);

            /** ConsensusParams evidence. */
            public evidence?: (tendermint.types.IEvidenceParams|null);

            /** ConsensusParams validator. */
            public validator?: (tendermint.types.IValidatorParams|null);

            /** ConsensusParams version. */
            public version?: (tendermint.types.IVersionParams|null);

            /**
             * Encodes the specified ConsensusParams message. Does not implicitly {@link tendermint.types.ConsensusParams.verify|verify} messages.
             * @param message ConsensusParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IConsensusParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConsensusParams message, length delimited. Does not implicitly {@link tendermint.types.ConsensusParams.verify|verify} messages.
             * @param message ConsensusParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IConsensusParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConsensusParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConsensusParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.ConsensusParams;

            /**
             * Decodes a ConsensusParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConsensusParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.ConsensusParams;

            /**
             * Verifies a ConsensusParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConsensusParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConsensusParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.ConsensusParams;

            /**
             * Creates a plain object from a ConsensusParams message. Also converts values to other types if specified.
             * @param message ConsensusParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.ConsensusParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConsensusParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a BlockParams. */
        interface IBlockParams {

            /** BlockParams max_bytes */
            max_bytes?: (Long|null);

            /** BlockParams max_gas */
            max_gas?: (Long|null);

            /** BlockParams time_iota_ms */
            time_iota_ms?: (Long|null);
        }

        /** Represents a BlockParams. */
        class BlockParams implements IBlockParams {

            /**
             * Constructs a new BlockParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IBlockParams);

            /** BlockParams max_bytes. */
            public max_bytes: Long;

            /** BlockParams max_gas. */
            public max_gas: Long;

            /** BlockParams time_iota_ms. */
            public time_iota_ms: Long;

            /**
             * Encodes the specified BlockParams message. Does not implicitly {@link tendermint.types.BlockParams.verify|verify} messages.
             * @param message BlockParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IBlockParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BlockParams message, length delimited. Does not implicitly {@link tendermint.types.BlockParams.verify|verify} messages.
             * @param message BlockParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IBlockParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BlockParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BlockParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.BlockParams;

            /**
             * Decodes a BlockParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BlockParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.BlockParams;

            /**
             * Verifies a BlockParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BlockParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BlockParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.BlockParams;

            /**
             * Creates a plain object from a BlockParams message. Also converts values to other types if specified.
             * @param message BlockParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.BlockParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BlockParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EvidenceParams. */
        interface IEvidenceParams {

            /** EvidenceParams max_age_num_blocks */
            max_age_num_blocks?: (Long|null);

            /** EvidenceParams max_age_duration */
            max_age_duration?: (google.protobuf.IDuration|null);

            /** EvidenceParams max_bytes */
            max_bytes?: (Long|null);
        }

        /** Represents an EvidenceParams. */
        class EvidenceParams implements IEvidenceParams {

            /**
             * Constructs a new EvidenceParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IEvidenceParams);

            /** EvidenceParams max_age_num_blocks. */
            public max_age_num_blocks: Long;

            /** EvidenceParams max_age_duration. */
            public max_age_duration?: (google.protobuf.IDuration|null);

            /** EvidenceParams max_bytes. */
            public max_bytes: Long;

            /**
             * Encodes the specified EvidenceParams message. Does not implicitly {@link tendermint.types.EvidenceParams.verify|verify} messages.
             * @param message EvidenceParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IEvidenceParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EvidenceParams message, length delimited. Does not implicitly {@link tendermint.types.EvidenceParams.verify|verify} messages.
             * @param message EvidenceParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IEvidenceParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EvidenceParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EvidenceParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.EvidenceParams;

            /**
             * Decodes an EvidenceParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EvidenceParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.EvidenceParams;

            /**
             * Verifies an EvidenceParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EvidenceParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EvidenceParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.EvidenceParams;

            /**
             * Creates a plain object from an EvidenceParams message. Also converts values to other types if specified.
             * @param message EvidenceParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.EvidenceParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EvidenceParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ValidatorParams. */
        interface IValidatorParams {

            /** ValidatorParams pub_key_types */
            pub_key_types?: (string[]|null);
        }

        /** Represents a ValidatorParams. */
        class ValidatorParams implements IValidatorParams {

            /**
             * Constructs a new ValidatorParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IValidatorParams);

            /** ValidatorParams pub_key_types. */
            public pub_key_types: string[];

            /**
             * Encodes the specified ValidatorParams message. Does not implicitly {@link tendermint.types.ValidatorParams.verify|verify} messages.
             * @param message ValidatorParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IValidatorParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ValidatorParams message, length delimited. Does not implicitly {@link tendermint.types.ValidatorParams.verify|verify} messages.
             * @param message ValidatorParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IValidatorParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ValidatorParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ValidatorParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.ValidatorParams;

            /**
             * Decodes a ValidatorParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ValidatorParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.ValidatorParams;

            /**
             * Verifies a ValidatorParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ValidatorParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ValidatorParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.ValidatorParams;

            /**
             * Creates a plain object from a ValidatorParams message. Also converts values to other types if specified.
             * @param message ValidatorParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.ValidatorParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ValidatorParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a VersionParams. */
        interface IVersionParams {

            /** VersionParams app_version */
            app_version?: (Long|null);
        }

        /** Represents a VersionParams. */
        class VersionParams implements IVersionParams {

            /**
             * Constructs a new VersionParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IVersionParams);

            /** VersionParams app_version. */
            public app_version: Long;

            /**
             * Encodes the specified VersionParams message. Does not implicitly {@link tendermint.types.VersionParams.verify|verify} messages.
             * @param message VersionParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IVersionParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified VersionParams message, length delimited. Does not implicitly {@link tendermint.types.VersionParams.verify|verify} messages.
             * @param message VersionParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IVersionParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a VersionParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VersionParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.VersionParams;

            /**
             * Decodes a VersionParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VersionParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.VersionParams;

            /**
             * Verifies a VersionParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a VersionParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VersionParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.VersionParams;

            /**
             * Creates a plain object from a VersionParams message. Also converts values to other types if specified.
             * @param message VersionParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.VersionParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this VersionParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a HashedParams. */
        interface IHashedParams {

            /** HashedParams block_max_bytes */
            block_max_bytes?: (Long|null);

            /** HashedParams block_max_gas */
            block_max_gas?: (Long|null);
        }

        /** Represents a HashedParams. */
        class HashedParams implements IHashedParams {

            /**
             * Constructs a new HashedParams.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.types.IHashedParams);

            /** HashedParams block_max_bytes. */
            public block_max_bytes: Long;

            /** HashedParams block_max_gas. */
            public block_max_gas: Long;

            /**
             * Encodes the specified HashedParams message. Does not implicitly {@link tendermint.types.HashedParams.verify|verify} messages.
             * @param message HashedParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.types.IHashedParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HashedParams message, length delimited. Does not implicitly {@link tendermint.types.HashedParams.verify|verify} messages.
             * @param message HashedParams message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.types.IHashedParams, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HashedParams message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HashedParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.types.HashedParams;

            /**
             * Decodes a HashedParams message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HashedParams
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.types.HashedParams;

            /**
             * Verifies a HashedParams message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HashedParams message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HashedParams
             */
            public static fromObject(object: { [k: string]: any }): tendermint.types.HashedParams;

            /**
             * Creates a plain object from a HashedParams message. Also converts values to other types if specified.
             * @param message HashedParams
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.types.HashedParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HashedParams to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace version. */
    namespace version {

        /** Properties of an App. */
        interface IApp {

            /** App protocol */
            protocol?: (Long|null);

            /** App software */
            software?: (string|null);
        }

        /** Represents an App. */
        class App implements IApp {

            /**
             * Constructs a new App.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.version.IApp);

            /** App protocol. */
            public protocol: Long;

            /** App software. */
            public software: string;

            /**
             * Encodes the specified App message. Does not implicitly {@link tendermint.version.App.verify|verify} messages.
             * @param message App message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.version.IApp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified App message, length delimited. Does not implicitly {@link tendermint.version.App.verify|verify} messages.
             * @param message App message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.version.IApp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an App message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns App
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.version.App;

            /**
             * Decodes an App message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns App
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.version.App;

            /**
             * Verifies an App message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an App message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns App
             */
            public static fromObject(object: { [k: string]: any }): tendermint.version.App;

            /**
             * Creates a plain object from an App message. Also converts values to other types if specified.
             * @param message App
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.version.App, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this App to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Consensus. */
        interface IConsensus {

            /** Consensus block */
            block?: (Long|null);

            /** Consensus app */
            app?: (Long|null);
        }

        /** Represents a Consensus. */
        class Consensus implements IConsensus {

            /**
             * Constructs a new Consensus.
             * @param [properties] Properties to set
             */
            constructor(properties?: tendermint.version.IConsensus);

            /** Consensus block. */
            public block: Long;

            /** Consensus app. */
            public app: Long;

            /**
             * Encodes the specified Consensus message. Does not implicitly {@link tendermint.version.Consensus.verify|verify} messages.
             * @param message Consensus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: tendermint.version.IConsensus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Consensus message, length delimited. Does not implicitly {@link tendermint.version.Consensus.verify|verify} messages.
             * @param message Consensus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: tendermint.version.IConsensus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Consensus message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Consensus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): tendermint.version.Consensus;

            /**
             * Decodes a Consensus message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Consensus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): tendermint.version.Consensus;

            /**
             * Verifies a Consensus message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Consensus message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Consensus
             */
            public static fromObject(object: { [k: string]: any }): tendermint.version.Consensus;

            /**
             * Creates a plain object from a Consensus message. Also converts values to other types if specified.
             * @param message Consensus
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: tendermint.version.Consensus, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Consensus to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a FileDescriptorSet. */
        interface IFileDescriptorSet {

            /** FileDescriptorSet file */
            file?: (google.protobuf.IFileDescriptorProto[]|null);
        }

        /** Represents a FileDescriptorSet. */
        class FileDescriptorSet implements IFileDescriptorSet {

            /**
             * Constructs a new FileDescriptorSet.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorSet);

            /** FileDescriptorSet file. */
            public file: google.protobuf.IFileDescriptorProto[];

            /**
             * Encodes the specified FileDescriptorSet message. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorSet message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorSet;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorSet;

            /**
             * Verifies a FileDescriptorSet message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorSet
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorSet;

            /**
             * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
             * @param message FileDescriptorSet
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorSet to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FileDescriptorProto. */
        interface IFileDescriptorProto {

            /** FileDescriptorProto name */
            name?: (string|null);

            /** FileDescriptorProto package */
            "package"?: (string|null);

            /** FileDescriptorProto dependency */
            dependency?: (string[]|null);

            /** FileDescriptorProto public_dependency */
            public_dependency?: (number[]|null);

            /** FileDescriptorProto weak_dependency */
            weak_dependency?: (number[]|null);

            /** FileDescriptorProto message_type */
            message_type?: (google.protobuf.IDescriptorProto[]|null);

            /** FileDescriptorProto enum_type */
            enum_type?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** FileDescriptorProto service */
            service?: (google.protobuf.IServiceDescriptorProto[]|null);

            /** FileDescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** FileDescriptorProto options */
            options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto source_code_info */
            source_code_info?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax */
            syntax?: (string|null);
        }

        /** Represents a FileDescriptorProto. */
        class FileDescriptorProto implements IFileDescriptorProto {

            /**
             * Constructs a new FileDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorProto);

            /** FileDescriptorProto name. */
            public name: string;

            /** FileDescriptorProto package. */
            public package: string;

            /** FileDescriptorProto dependency. */
            public dependency: string[];

            /** FileDescriptorProto public_dependency. */
            public public_dependency: number[];

            /** FileDescriptorProto weak_dependency. */
            public weak_dependency: number[];

            /** FileDescriptorProto message_type. */
            public message_type: google.protobuf.IDescriptorProto[];

            /** FileDescriptorProto enum_type. */
            public enum_type: google.protobuf.IEnumDescriptorProto[];

            /** FileDescriptorProto service. */
            public service: google.protobuf.IServiceDescriptorProto[];

            /** FileDescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** FileDescriptorProto options. */
            public options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto source_code_info. */
            public source_code_info?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax. */
            public syntax: string;

            /**
             * Encodes the specified FileDescriptorProto message. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorProto;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorProto;

            /**
             * Verifies a FileDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorProto;

            /**
             * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
             * @param message FileDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a DescriptorProto. */
        interface IDescriptorProto {

            /** DescriptorProto name */
            name?: (string|null);

            /** DescriptorProto field */
            field?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto nested_type */
            nested_type?: (google.protobuf.IDescriptorProto[]|null);

            /** DescriptorProto enum_type */
            enum_type?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** DescriptorProto extension_range */
            extension_range?: (google.protobuf.DescriptorProto.IExtensionRange[]|null);

            /** DescriptorProto oneof_decl */
            oneof_decl?: (google.protobuf.IOneofDescriptorProto[]|null);

            /** DescriptorProto options */
            options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reserved_range */
            reserved_range?: (google.protobuf.DescriptorProto.IReservedRange[]|null);

            /** DescriptorProto reserved_name */
            reserved_name?: (string[]|null);
        }

        /** Represents a DescriptorProto. */
        class DescriptorProto implements IDescriptorProto {

            /**
             * Constructs a new DescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IDescriptorProto);

            /** DescriptorProto name. */
            public name: string;

            /** DescriptorProto field. */
            public field: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto nested_type. */
            public nested_type: google.protobuf.IDescriptorProto[];

            /** DescriptorProto enum_type. */
            public enum_type: google.protobuf.IEnumDescriptorProto[];

            /** DescriptorProto extension_range. */
            public extension_range: google.protobuf.DescriptorProto.IExtensionRange[];

            /** DescriptorProto oneof_decl. */
            public oneof_decl: google.protobuf.IOneofDescriptorProto[];

            /** DescriptorProto options. */
            public options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reserved_range. */
            public reserved_range: google.protobuf.DescriptorProto.IReservedRange[];

            /** DescriptorProto reserved_name. */
            public reserved_name: string[];

            /**
             * Encodes the specified DescriptorProto message. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto;

            /**
             * Verifies a DescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto;

            /**
             * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
             * @param message DescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.DescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace DescriptorProto {

            /** Properties of an ExtensionRange. */
            interface IExtensionRange {

                /** ExtensionRange start */
                start?: (number|null);

                /** ExtensionRange end */
                end?: (number|null);
            }

            /** Represents an ExtensionRange. */
            class ExtensionRange implements IExtensionRange {

                /**
                 * Constructs a new ExtensionRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IExtensionRange);

                /** ExtensionRange start. */
                public start: number;

                /** ExtensionRange end. */
                public end: number;

                /**
                 * Encodes the specified ExtensionRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExtensionRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Verifies an ExtensionRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExtensionRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
                 * @param message ExtensionRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ExtensionRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExtensionRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ReservedRange. */
            interface IReservedRange {

                /** ReservedRange start */
                start?: (number|null);

                /** ReservedRange end */
                end?: (number|null);
            }

            /** Represents a ReservedRange. */
            class ReservedRange implements IReservedRange {

                /**
                 * Constructs a new ReservedRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IReservedRange);

                /** ReservedRange start. */
                public start: number;

                /** ReservedRange end. */
                public end: number;

                /**
                 * Encodes the specified ReservedRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ReservedRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Verifies a ReservedRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ReservedRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                 * @param message ReservedRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ReservedRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a FieldDescriptorProto. */
        interface IFieldDescriptorProto {

            /** FieldDescriptorProto name */
            name?: (string|null);

            /** FieldDescriptorProto number */
            number?: (number|null);

            /** FieldDescriptorProto label */
            label?: (google.protobuf.FieldDescriptorProto.Label|null);

            /** FieldDescriptorProto type */
            type?: (google.protobuf.FieldDescriptorProto.Type|null);

            /** FieldDescriptorProto type_name */
            type_name?: (string|null);

            /** FieldDescriptorProto extendee */
            extendee?: (string|null);

            /** FieldDescriptorProto default_value */
            default_value?: (string|null);

            /** FieldDescriptorProto oneof_index */
            oneof_index?: (number|null);

            /** FieldDescriptorProto json_name */
            json_name?: (string|null);

            /** FieldDescriptorProto options */
            options?: (google.protobuf.IFieldOptions|null);
        }

        /** Represents a FieldDescriptorProto. */
        class FieldDescriptorProto implements IFieldDescriptorProto {

            /**
             * Constructs a new FieldDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldDescriptorProto);

            /** FieldDescriptorProto name. */
            public name: string;

            /** FieldDescriptorProto number. */
            public number: number;

            /** FieldDescriptorProto label. */
            public label: google.protobuf.FieldDescriptorProto.Label;

            /** FieldDescriptorProto type. */
            public type: google.protobuf.FieldDescriptorProto.Type;

            /** FieldDescriptorProto type_name. */
            public type_name: string;

            /** FieldDescriptorProto extendee. */
            public extendee: string;

            /** FieldDescriptorProto default_value. */
            public default_value: string;

            /** FieldDescriptorProto oneof_index. */
            public oneof_index: number;

            /** FieldDescriptorProto json_name. */
            public json_name: string;

            /** FieldDescriptorProto options. */
            public options?: (google.protobuf.IFieldOptions|null);

            /**
             * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldDescriptorProto;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldDescriptorProto;

            /**
             * Verifies a FieldDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldDescriptorProto;

            /**
             * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
             * @param message FieldDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FieldDescriptorProto {

            /** Type enum. */
            enum Type {
                TYPE_DOUBLE = 1,
                TYPE_FLOAT = 2,
                TYPE_INT64 = 3,
                TYPE_UINT64 = 4,
                TYPE_INT32 = 5,
                TYPE_FIXED64 = 6,
                TYPE_FIXED32 = 7,
                TYPE_BOOL = 8,
                TYPE_STRING = 9,
                TYPE_GROUP = 10,
                TYPE_MESSAGE = 11,
                TYPE_BYTES = 12,
                TYPE_UINT32 = 13,
                TYPE_ENUM = 14,
                TYPE_SFIXED32 = 15,
                TYPE_SFIXED64 = 16,
                TYPE_SINT32 = 17,
                TYPE_SINT64 = 18
            }

            /** Label enum. */
            enum Label {
                LABEL_OPTIONAL = 1,
                LABEL_REQUIRED = 2,
                LABEL_REPEATED = 3
            }
        }

        /** Properties of an OneofDescriptorProto. */
        interface IOneofDescriptorProto {

            /** OneofDescriptorProto name */
            name?: (string|null);

            /** OneofDescriptorProto options */
            options?: (google.protobuf.IOneofOptions|null);
        }

        /** Represents an OneofDescriptorProto. */
        class OneofDescriptorProto implements IOneofDescriptorProto {

            /**
             * Constructs a new OneofDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofDescriptorProto);

            /** OneofDescriptorProto name. */
            public name: string;

            /** OneofDescriptorProto options. */
            public options?: (google.protobuf.IOneofOptions|null);

            /**
             * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofDescriptorProto;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofDescriptorProto;

            /**
             * Verifies an OneofDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofDescriptorProto;

            /**
             * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
             * @param message OneofDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumDescriptorProto. */
        interface IEnumDescriptorProto {

            /** EnumDescriptorProto name */
            name?: (string|null);

            /** EnumDescriptorProto value */
            value?: (google.protobuf.IEnumValueDescriptorProto[]|null);

            /** EnumDescriptorProto options */
            options?: (google.protobuf.IEnumOptions|null);
        }

        /** Represents an EnumDescriptorProto. */
        class EnumDescriptorProto implements IEnumDescriptorProto {

            /**
             * Constructs a new EnumDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumDescriptorProto);

            /** EnumDescriptorProto name. */
            public name: string;

            /** EnumDescriptorProto value. */
            public value: google.protobuf.IEnumValueDescriptorProto[];

            /** EnumDescriptorProto options. */
            public options?: (google.protobuf.IEnumOptions|null);

            /**
             * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto;

            /**
             * Verifies an EnumDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto;

            /**
             * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumValueDescriptorProto. */
        interface IEnumValueDescriptorProto {

            /** EnumValueDescriptorProto name */
            name?: (string|null);

            /** EnumValueDescriptorProto number */
            number?: (number|null);

            /** EnumValueDescriptorProto options */
            options?: (google.protobuf.IEnumValueOptions|null);
        }

        /** Represents an EnumValueDescriptorProto. */
        class EnumValueDescriptorProto implements IEnumValueDescriptorProto {

            /**
             * Constructs a new EnumValueDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueDescriptorProto);

            /** EnumValueDescriptorProto name. */
            public name: string;

            /** EnumValueDescriptorProto number. */
            public number: number;

            /** EnumValueDescriptorProto options. */
            public options?: (google.protobuf.IEnumValueOptions|null);

            /**
             * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueDescriptorProto;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueDescriptorProto;

            /**
             * Verifies an EnumValueDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueDescriptorProto;

            /**
             * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumValueDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ServiceDescriptorProto. */
        interface IServiceDescriptorProto {

            /** ServiceDescriptorProto name */
            name?: (string|null);

            /** ServiceDescriptorProto method */
            method?: (google.protobuf.IMethodDescriptorProto[]|null);

            /** ServiceDescriptorProto options */
            options?: (google.protobuf.IServiceOptions|null);
        }

        /** Represents a ServiceDescriptorProto. */
        class ServiceDescriptorProto implements IServiceDescriptorProto {

            /**
             * Constructs a new ServiceDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceDescriptorProto);

            /** ServiceDescriptorProto name. */
            public name: string;

            /** ServiceDescriptorProto method. */
            public method: google.protobuf.IMethodDescriptorProto[];

            /** ServiceDescriptorProto options. */
            public options?: (google.protobuf.IServiceOptions|null);

            /**
             * Encodes the specified ServiceDescriptorProto message. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceDescriptorProto;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceDescriptorProto;

            /**
             * Verifies a ServiceDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceDescriptorProto;

            /**
             * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
             * @param message ServiceDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MethodDescriptorProto. */
        interface IMethodDescriptorProto {

            /** MethodDescriptorProto name */
            name?: (string|null);

            /** MethodDescriptorProto input_type */
            input_type?: (string|null);

            /** MethodDescriptorProto output_type */
            output_type?: (string|null);

            /** MethodDescriptorProto options */
            options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto client_streaming */
            client_streaming?: (boolean|null);

            /** MethodDescriptorProto server_streaming */
            server_streaming?: (boolean|null);
        }

        /** Represents a MethodDescriptorProto. */
        class MethodDescriptorProto implements IMethodDescriptorProto {

            /**
             * Constructs a new MethodDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodDescriptorProto);

            /** MethodDescriptorProto name. */
            public name: string;

            /** MethodDescriptorProto input_type. */
            public input_type: string;

            /** MethodDescriptorProto output_type. */
            public output_type: string;

            /** MethodDescriptorProto options. */
            public options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto client_streaming. */
            public client_streaming: boolean;

            /** MethodDescriptorProto server_streaming. */
            public server_streaming: boolean;

            /**
             * Encodes the specified MethodDescriptorProto message. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodDescriptorProto;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodDescriptorProto;

            /**
             * Verifies a MethodDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodDescriptorProto;

            /**
             * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
             * @param message MethodDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FileOptions. */
        interface IFileOptions {

            /** FileOptions java_package */
            java_package?: (string|null);

            /** FileOptions java_outer_classname */
            java_outer_classname?: (string|null);

            /** FileOptions java_multiple_files */
            java_multiple_files?: (boolean|null);

            /** FileOptions java_generate_equals_and_hash */
            java_generate_equals_and_hash?: (boolean|null);

            /** FileOptions java_string_check_utf8 */
            java_string_check_utf8?: (boolean|null);

            /** FileOptions optimize_for */
            optimize_for?: (google.protobuf.FileOptions.OptimizeMode|null);

            /** FileOptions go_package */
            go_package?: (string|null);

            /** FileOptions cc_generic_services */
            cc_generic_services?: (boolean|null);

            /** FileOptions java_generic_services */
            java_generic_services?: (boolean|null);

            /** FileOptions py_generic_services */
            py_generic_services?: (boolean|null);

            /** FileOptions deprecated */
            deprecated?: (boolean|null);

            /** FileOptions cc_enable_arenas */
            cc_enable_arenas?: (boolean|null);

            /** FileOptions objc_class_prefix */
            objc_class_prefix?: (string|null);

            /** FileOptions csharp_namespace */
            csharp_namespace?: (string|null);

            /** FileOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** FileOptions .gogoproto.goproto_getters_all */
            ".gogoproto.goproto_getters_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_enum_prefix_all */
            ".gogoproto.goproto_enum_prefix_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_stringer_all */
            ".gogoproto.goproto_stringer_all"?: (boolean|null);

            /** FileOptions .gogoproto.verbose_equal_all */
            ".gogoproto.verbose_equal_all"?: (boolean|null);

            /** FileOptions .gogoproto.face_all */
            ".gogoproto.face_all"?: (boolean|null);

            /** FileOptions .gogoproto.gostring_all */
            ".gogoproto.gostring_all"?: (boolean|null);

            /** FileOptions .gogoproto.populate_all */
            ".gogoproto.populate_all"?: (boolean|null);

            /** FileOptions .gogoproto.stringer_all */
            ".gogoproto.stringer_all"?: (boolean|null);

            /** FileOptions .gogoproto.onlyone_all */
            ".gogoproto.onlyone_all"?: (boolean|null);

            /** FileOptions .gogoproto.equal_all */
            ".gogoproto.equal_all"?: (boolean|null);

            /** FileOptions .gogoproto.description_all */
            ".gogoproto.description_all"?: (boolean|null);

            /** FileOptions .gogoproto.testgen_all */
            ".gogoproto.testgen_all"?: (boolean|null);

            /** FileOptions .gogoproto.benchgen_all */
            ".gogoproto.benchgen_all"?: (boolean|null);

            /** FileOptions .gogoproto.marshaler_all */
            ".gogoproto.marshaler_all"?: (boolean|null);

            /** FileOptions .gogoproto.unmarshaler_all */
            ".gogoproto.unmarshaler_all"?: (boolean|null);

            /** FileOptions .gogoproto.stable_marshaler_all */
            ".gogoproto.stable_marshaler_all"?: (boolean|null);

            /** FileOptions .gogoproto.sizer_all */
            ".gogoproto.sizer_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_enum_stringer_all */
            ".gogoproto.goproto_enum_stringer_all"?: (boolean|null);

            /** FileOptions .gogoproto.enum_stringer_all */
            ".gogoproto.enum_stringer_all"?: (boolean|null);

            /** FileOptions .gogoproto.unsafe_marshaler_all */
            ".gogoproto.unsafe_marshaler_all"?: (boolean|null);

            /** FileOptions .gogoproto.unsafe_unmarshaler_all */
            ".gogoproto.unsafe_unmarshaler_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_extensions_map_all */
            ".gogoproto.goproto_extensions_map_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_unrecognized_all */
            ".gogoproto.goproto_unrecognized_all"?: (boolean|null);

            /** FileOptions .gogoproto.gogoproto_import */
            ".gogoproto.gogoproto_import"?: (boolean|null);

            /** FileOptions .gogoproto.protosizer_all */
            ".gogoproto.protosizer_all"?: (boolean|null);

            /** FileOptions .gogoproto.compare_all */
            ".gogoproto.compare_all"?: (boolean|null);

            /** FileOptions .gogoproto.typedecl_all */
            ".gogoproto.typedecl_all"?: (boolean|null);

            /** FileOptions .gogoproto.enumdecl_all */
            ".gogoproto.enumdecl_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_registration */
            ".gogoproto.goproto_registration"?: (boolean|null);

            /** FileOptions .gogoproto.messagename_all */
            ".gogoproto.messagename_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_sizecache_all */
            ".gogoproto.goproto_sizecache_all"?: (boolean|null);

            /** FileOptions .gogoproto.goproto_unkeyed_all */
            ".gogoproto.goproto_unkeyed_all"?: (boolean|null);

            /** FileOptions .cosmos_proto.declare_interface */
            ".cosmos_proto.declare_interface"?: (cosmos_proto.IInterfaceDescriptor[]|null);

            /** FileOptions .cosmos_proto.declare_scalar */
            ".cosmos_proto.declare_scalar"?: (cosmos_proto.IScalarDescriptor[]|null);
        }

        /** Represents a FileOptions. */
        class FileOptions implements IFileOptions {

            /**
             * Constructs a new FileOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileOptions);

            /** FileOptions java_package. */
            public java_package: string;

            /** FileOptions java_outer_classname. */
            public java_outer_classname: string;

            /** FileOptions java_multiple_files. */
            public java_multiple_files: boolean;

            /** FileOptions java_generate_equals_and_hash. */
            public java_generate_equals_and_hash: boolean;

            /** FileOptions java_string_check_utf8. */
            public java_string_check_utf8: boolean;

            /** FileOptions optimize_for. */
            public optimize_for: google.protobuf.FileOptions.OptimizeMode;

            /** FileOptions go_package. */
            public go_package: string;

            /** FileOptions cc_generic_services. */
            public cc_generic_services: boolean;

            /** FileOptions java_generic_services. */
            public java_generic_services: boolean;

            /** FileOptions py_generic_services. */
            public py_generic_services: boolean;

            /** FileOptions deprecated. */
            public deprecated: boolean;

            /** FileOptions cc_enable_arenas. */
            public cc_enable_arenas: boolean;

            /** FileOptions objc_class_prefix. */
            public objc_class_prefix: string;

            /** FileOptions csharp_namespace. */
            public csharp_namespace: string;

            /** FileOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified FileOptions message. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileOptions message, length delimited. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileOptions;

            /**
             * Decodes a FileOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileOptions;

            /**
             * Verifies a FileOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileOptions;

            /**
             * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
             * @param message FileOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FileOptions {

            /** OptimizeMode enum. */
            enum OptimizeMode {
                SPEED = 1,
                CODE_SIZE = 2,
                LITE_RUNTIME = 3
            }
        }

        /** Properties of a MessageOptions. */
        interface IMessageOptions {

            /** MessageOptions message_set_wire_format */
            message_set_wire_format?: (boolean|null);

            /** MessageOptions no_standard_descriptor_accessor */
            no_standard_descriptor_accessor?: (boolean|null);

            /** MessageOptions deprecated */
            deprecated?: (boolean|null);

            /** MessageOptions map_entry */
            map_entry?: (boolean|null);

            /** MessageOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** MessageOptions .gogoproto.goproto_getters */
            ".gogoproto.goproto_getters"?: (boolean|null);

            /** MessageOptions .gogoproto.goproto_stringer */
            ".gogoproto.goproto_stringer"?: (boolean|null);

            /** MessageOptions .gogoproto.verbose_equal */
            ".gogoproto.verbose_equal"?: (boolean|null);

            /** MessageOptions .gogoproto.face */
            ".gogoproto.face"?: (boolean|null);

            /** MessageOptions .gogoproto.gostring */
            ".gogoproto.gostring"?: (boolean|null);

            /** MessageOptions .gogoproto.populate */
            ".gogoproto.populate"?: (boolean|null);

            /** MessageOptions .gogoproto.stringer */
            ".gogoproto.stringer"?: (boolean|null);

            /** MessageOptions .gogoproto.onlyone */
            ".gogoproto.onlyone"?: (boolean|null);

            /** MessageOptions .gogoproto.equal */
            ".gogoproto.equal"?: (boolean|null);

            /** MessageOptions .gogoproto.description */
            ".gogoproto.description"?: (boolean|null);

            /** MessageOptions .gogoproto.testgen */
            ".gogoproto.testgen"?: (boolean|null);

            /** MessageOptions .gogoproto.benchgen */
            ".gogoproto.benchgen"?: (boolean|null);

            /** MessageOptions .gogoproto.marshaler */
            ".gogoproto.marshaler"?: (boolean|null);

            /** MessageOptions .gogoproto.unmarshaler */
            ".gogoproto.unmarshaler"?: (boolean|null);

            /** MessageOptions .gogoproto.stable_marshaler */
            ".gogoproto.stable_marshaler"?: (boolean|null);

            /** MessageOptions .gogoproto.sizer */
            ".gogoproto.sizer"?: (boolean|null);

            /** MessageOptions .gogoproto.unsafe_marshaler */
            ".gogoproto.unsafe_marshaler"?: (boolean|null);

            /** MessageOptions .gogoproto.unsafe_unmarshaler */
            ".gogoproto.unsafe_unmarshaler"?: (boolean|null);

            /** MessageOptions .gogoproto.goproto_extensions_map */
            ".gogoproto.goproto_extensions_map"?: (boolean|null);

            /** MessageOptions .gogoproto.goproto_unrecognized */
            ".gogoproto.goproto_unrecognized"?: (boolean|null);

            /** MessageOptions .gogoproto.protosizer */
            ".gogoproto.protosizer"?: (boolean|null);

            /** MessageOptions .gogoproto.compare */
            ".gogoproto.compare"?: (boolean|null);

            /** MessageOptions .gogoproto.typedecl */
            ".gogoproto.typedecl"?: (boolean|null);

            /** MessageOptions .gogoproto.messagename */
            ".gogoproto.messagename"?: (boolean|null);

            /** MessageOptions .gogoproto.goproto_sizecache */
            ".gogoproto.goproto_sizecache"?: (boolean|null);

            /** MessageOptions .gogoproto.goproto_unkeyed */
            ".gogoproto.goproto_unkeyed"?: (boolean|null);

            /** MessageOptions .cosmos_proto.implements_interface */
            ".cosmos_proto.implements_interface"?: (string[]|null);
        }

        /** Represents a MessageOptions. */
        class MessageOptions implements IMessageOptions {

            /**
             * Constructs a new MessageOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMessageOptions);

            /** MessageOptions message_set_wire_format. */
            public message_set_wire_format: boolean;

            /** MessageOptions no_standard_descriptor_accessor. */
            public no_standard_descriptor_accessor: boolean;

            /** MessageOptions deprecated. */
            public deprecated: boolean;

            /** MessageOptions map_entry. */
            public map_entry: boolean;

            /** MessageOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified MessageOptions message. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageOptions message, length delimited. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MessageOptions;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MessageOptions;

            /**
             * Verifies a MessageOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MessageOptions;

            /**
             * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
             * @param message MessageOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MessageOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FieldOptions. */
        interface IFieldOptions {

            /** FieldOptions ctype */
            ctype?: (google.protobuf.FieldOptions.CType|null);

            /** FieldOptions packed */
            packed?: (boolean|null);

            /** FieldOptions jstype */
            jstype?: (google.protobuf.FieldOptions.JSType|null);

            /** FieldOptions lazy */
            lazy?: (boolean|null);

            /** FieldOptions deprecated */
            deprecated?: (boolean|null);

            /** FieldOptions weak */
            weak?: (boolean|null);

            /** FieldOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** FieldOptions .gogoproto.nullable */
            ".gogoproto.nullable"?: (boolean|null);

            /** FieldOptions .gogoproto.embed */
            ".gogoproto.embed"?: (boolean|null);

            /** FieldOptions .gogoproto.customtype */
            ".gogoproto.customtype"?: (string|null);

            /** FieldOptions .gogoproto.customname */
            ".gogoproto.customname"?: (string|null);

            /** FieldOptions .gogoproto.jsontag */
            ".gogoproto.jsontag"?: (string|null);

            /** FieldOptions .gogoproto.moretags */
            ".gogoproto.moretags"?: (string|null);

            /** FieldOptions .gogoproto.casttype */
            ".gogoproto.casttype"?: (string|null);

            /** FieldOptions .gogoproto.castkey */
            ".gogoproto.castkey"?: (string|null);

            /** FieldOptions .gogoproto.castvalue */
            ".gogoproto.castvalue"?: (string|null);

            /** FieldOptions .gogoproto.stdtime */
            ".gogoproto.stdtime"?: (boolean|null);

            /** FieldOptions .gogoproto.stdduration */
            ".gogoproto.stdduration"?: (boolean|null);

            /** FieldOptions .gogoproto.wktpointer */
            ".gogoproto.wktpointer"?: (boolean|null);

            /** FieldOptions .gogoproto.castrepeated */
            ".gogoproto.castrepeated"?: (string|null);

            /** FieldOptions .cosmos_proto.accepts_interface */
            ".cosmos_proto.accepts_interface"?: (string|null);

            /** FieldOptions .cosmos_proto.scalar */
            ".cosmos_proto.scalar"?: (string|null);
        }

        /** Represents a FieldOptions. */
        class FieldOptions implements IFieldOptions {

            /**
             * Constructs a new FieldOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldOptions);

            /** FieldOptions ctype. */
            public ctype: google.protobuf.FieldOptions.CType;

            /** FieldOptions packed. */
            public packed: boolean;

            /** FieldOptions jstype. */
            public jstype: google.protobuf.FieldOptions.JSType;

            /** FieldOptions lazy. */
            public lazy: boolean;

            /** FieldOptions deprecated. */
            public deprecated: boolean;

            /** FieldOptions weak. */
            public weak: boolean;

            /** FieldOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified FieldOptions message. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldOptions message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions;

            /**
             * Verifies a FieldOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions;

            /**
             * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
             * @param message FieldOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FieldOptions {

            /** CType enum. */
            enum CType {
                STRING = 0,
                CORD = 1,
                STRING_PIECE = 2
            }

            /** JSType enum. */
            enum JSType {
                JS_NORMAL = 0,
                JS_STRING = 1,
                JS_NUMBER = 2
            }
        }

        /** Properties of an OneofOptions. */
        interface IOneofOptions {

            /** OneofOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an OneofOptions. */
        class OneofOptions implements IOneofOptions {

            /**
             * Constructs a new OneofOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofOptions);

            /** OneofOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified OneofOptions message. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofOptions message, length delimited. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofOptions;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofOptions;

            /**
             * Verifies an OneofOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofOptions;

            /**
             * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
             * @param message OneofOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumOptions. */
        interface IEnumOptions {

            /** EnumOptions allow_alias */
            allow_alias?: (boolean|null);

            /** EnumOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** EnumOptions .gogoproto.goproto_enum_prefix */
            ".gogoproto.goproto_enum_prefix"?: (boolean|null);

            /** EnumOptions .gogoproto.goproto_enum_stringer */
            ".gogoproto.goproto_enum_stringer"?: (boolean|null);

            /** EnumOptions .gogoproto.enum_stringer */
            ".gogoproto.enum_stringer"?: (boolean|null);

            /** EnumOptions .gogoproto.enum_customname */
            ".gogoproto.enum_customname"?: (string|null);

            /** EnumOptions .gogoproto.enumdecl */
            ".gogoproto.enumdecl"?: (boolean|null);
        }

        /** Represents an EnumOptions. */
        class EnumOptions implements IEnumOptions {

            /**
             * Constructs a new EnumOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumOptions);

            /** EnumOptions allow_alias. */
            public allow_alias: boolean;

            /** EnumOptions deprecated. */
            public deprecated: boolean;

            /** EnumOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified EnumOptions message. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumOptions;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumOptions;

            /**
             * Verifies an EnumOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumOptions;

            /**
             * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
             * @param message EnumOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumValueOptions. */
        interface IEnumValueOptions {

            /** EnumValueOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumValueOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** EnumValueOptions .gogoproto.enumvalue_customname */
            ".gogoproto.enumvalue_customname"?: (string|null);
        }

        /** Represents an EnumValueOptions. */
        class EnumValueOptions implements IEnumValueOptions {

            /**
             * Constructs a new EnumValueOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueOptions);

            /** EnumValueOptions deprecated. */
            public deprecated: boolean;

            /** EnumValueOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified EnumValueOptions message. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueOptions;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueOptions;

            /**
             * Verifies an EnumValueOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueOptions;

            /**
             * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
             * @param message EnumValueOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ServiceOptions. */
        interface IServiceOptions {

            /** ServiceOptions deprecated */
            deprecated?: (boolean|null);

            /** ServiceOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents a ServiceOptions. */
        class ServiceOptions implements IServiceOptions {

            /**
             * Constructs a new ServiceOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceOptions);

            /** ServiceOptions deprecated. */
            public deprecated: boolean;

            /** ServiceOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified ServiceOptions message. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceOptions message, length delimited. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceOptions;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceOptions;

            /**
             * Verifies a ServiceOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceOptions;

            /**
             * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
             * @param message ServiceOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MethodOptions. */
        interface IMethodOptions {

            /** MethodOptions deprecated */
            deprecated?: (boolean|null);

            /** MethodOptions uninterpreted_option */
            uninterpreted_option?: (google.protobuf.IUninterpretedOption[]|null);

            /** MethodOptions .google.api.http */
            ".google.api.http"?: (google.api.IHttpRule|null);
        }

        /** Represents a MethodOptions. */
        class MethodOptions implements IMethodOptions {

            /**
             * Constructs a new MethodOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodOptions);

            /** MethodOptions deprecated. */
            public deprecated: boolean;

            /** MethodOptions uninterpreted_option. */
            public uninterpreted_option: google.protobuf.IUninterpretedOption[];

            /**
             * Encodes the specified MethodOptions message. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodOptions message, length delimited. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodOptions;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodOptions;

            /**
             * Verifies a MethodOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodOptions;

            /**
             * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
             * @param message MethodOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an UninterpretedOption. */
        interface IUninterpretedOption {

            /** UninterpretedOption name */
            name?: (google.protobuf.UninterpretedOption.INamePart[]|null);

            /** UninterpretedOption identifier_value */
            identifier_value?: (string|null);

            /** UninterpretedOption positive_int_value */
            positive_int_value?: (Long|null);

            /** UninterpretedOption negative_int_value */
            negative_int_value?: (Long|null);

            /** UninterpretedOption double_value */
            double_value?: (number|null);

            /** UninterpretedOption string_value */
            string_value?: (Uint8Array|null);

            /** UninterpretedOption aggregate_value */
            aggregate_value?: (string|null);
        }

        /** Represents an UninterpretedOption. */
        class UninterpretedOption implements IUninterpretedOption {

            /**
             * Constructs a new UninterpretedOption.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IUninterpretedOption);

            /** UninterpretedOption name. */
            public name: google.protobuf.UninterpretedOption.INamePart[];

            /** UninterpretedOption identifier_value. */
            public identifier_value: string;

            /** UninterpretedOption positive_int_value. */
            public positive_int_value: Long;

            /** UninterpretedOption negative_int_value. */
            public negative_int_value: Long;

            /** UninterpretedOption double_value. */
            public double_value: number;

            /** UninterpretedOption string_value. */
            public string_value: Uint8Array;

            /** UninterpretedOption aggregate_value. */
            public aggregate_value: string;

            /**
             * Encodes the specified UninterpretedOption message. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UninterpretedOption message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption;

            /**
             * Verifies an UninterpretedOption message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UninterpretedOption
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption;

            /**
             * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
             * @param message UninterpretedOption
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.UninterpretedOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UninterpretedOption to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace UninterpretedOption {

            /** Properties of a NamePart. */
            interface INamePart {

                /** NamePart name_part */
                name_part: string;

                /** NamePart is_extension */
                is_extension: boolean;
            }

            /** Represents a NamePart. */
            class NamePart implements INamePart {

                /**
                 * Constructs a new NamePart.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.UninterpretedOption.INamePart);

                /** NamePart name_part. */
                public name_part: string;

                /** NamePart is_extension. */
                public is_extension: boolean;

                /**
                 * Encodes the specified NamePart message. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified NamePart message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a NamePart message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Decodes a NamePart message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Verifies a NamePart message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns NamePart
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                 * @param message NamePart
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.UninterpretedOption.NamePart, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this NamePart to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a SourceCodeInfo. */
        interface ISourceCodeInfo {

            /** SourceCodeInfo location */
            location?: (google.protobuf.SourceCodeInfo.ILocation[]|null);
        }

        /** Represents a SourceCodeInfo. */
        class SourceCodeInfo implements ISourceCodeInfo {

            /**
             * Constructs a new SourceCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ISourceCodeInfo);

            /** SourceCodeInfo location. */
            public location: google.protobuf.SourceCodeInfo.ILocation[];

            /**
             * Encodes the specified SourceCodeInfo message. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SourceCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo;

            /**
             * Verifies a SourceCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SourceCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo;

            /**
             * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
             * @param message SourceCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.SourceCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SourceCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace SourceCodeInfo {

            /** Properties of a Location. */
            interface ILocation {

                /** Location path */
                path?: (number[]|null);

                /** Location span */
                span?: (number[]|null);

                /** Location leading_comments */
                leading_comments?: (string|null);

                /** Location trailing_comments */
                trailing_comments?: (string|null);

                /** Location leading_detached_comments */
                leading_detached_comments?: (string[]|null);
            }

            /** Represents a Location. */
            class Location implements ILocation {

                /**
                 * Constructs a new Location.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.SourceCodeInfo.ILocation);

                /** Location path. */
                public path: number[];

                /** Location span. */
                public span: number[];

                /** Location leading_comments. */
                public leading_comments: string;

                /** Location trailing_comments. */
                public trailing_comments: string;

                /** Location leading_detached_comments. */
                public leading_detached_comments: string[];

                /**
                 * Encodes the specified Location message. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Location message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Location message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Decodes a Location message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Verifies a Location message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Location message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Location
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Creates a plain object from a Location message. Also converts values to other types if specified.
                 * @param message Location
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.SourceCodeInfo.Location, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Location to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a GeneratedCodeInfo. */
        interface IGeneratedCodeInfo {

            /** GeneratedCodeInfo annotation */
            annotation?: (google.protobuf.GeneratedCodeInfo.IAnnotation[]|null);
        }

        /** Represents a GeneratedCodeInfo. */
        class GeneratedCodeInfo implements IGeneratedCodeInfo {

            /**
             * Constructs a new GeneratedCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IGeneratedCodeInfo);

            /** GeneratedCodeInfo annotation. */
            public annotation: google.protobuf.GeneratedCodeInfo.IAnnotation[];

            /**
             * Encodes the specified GeneratedCodeInfo message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GeneratedCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo;

            /**
             * Verifies a GeneratedCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GeneratedCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo;

            /**
             * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
             * @param message GeneratedCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.GeneratedCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GeneratedCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace GeneratedCodeInfo {

            /** Properties of an Annotation. */
            interface IAnnotation {

                /** Annotation path */
                path?: (number[]|null);

                /** Annotation source_file */
                source_file?: (string|null);

                /** Annotation begin */
                begin?: (number|null);

                /** Annotation end */
                end?: (number|null);
            }

            /** Represents an Annotation. */
            class Annotation implements IAnnotation {

                /**
                 * Constructs a new Annotation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation);

                /** Annotation path. */
                public path: number[];

                /** Annotation source_file. */
                public source_file: string;

                /** Annotation begin. */
                public begin: number;

                /** Annotation end. */
                public end: number;

                /**
                 * Encodes the specified Annotation message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Annotation message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Annotation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Decodes an Annotation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Verifies an Annotation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Annotation
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Creates a plain object from an Annotation message. Also converts values to other types if specified.
                 * @param message Annotation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.GeneratedCodeInfo.Annotation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Annotation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a Timestamp. */
        interface ITimestamp {

            /** Timestamp seconds */
            seconds?: (Long|null);

            /** Timestamp nanos */
            nanos?: (number|null);
        }

        /** Represents a Timestamp. */
        class Timestamp implements ITimestamp {

            /**
             * Constructs a new Timestamp.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ITimestamp);

            /** Timestamp seconds. */
            public seconds: Long;

            /** Timestamp nanos. */
            public nanos: number;

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Timestamp;

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Timestamp;

            /**
             * Verifies a Timestamp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Timestamp
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Timestamp;

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @param message Timestamp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Timestamp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Duration. */
        interface IDuration {

            /** Duration seconds */
            seconds?: (Long|null);

            /** Duration nanos */
            nanos?: (number|null);
        }

        /** Represents a Duration. */
        class Duration implements IDuration {

            /**
             * Constructs a new Duration.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IDuration);

            /** Duration seconds. */
            public seconds: Long;

            /** Duration nanos. */
            public nanos: number;

            /**
             * Encodes the specified Duration message. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
             * @param message Duration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Duration message, length delimited. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
             * @param message Duration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Duration message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Duration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Duration;

            /**
             * Decodes a Duration message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Duration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Duration;

            /**
             * Verifies a Duration message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Duration message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Duration
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Duration;

            /**
             * Creates a plain object from a Duration message. Also converts values to other types if specified.
             * @param message Duration
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Duration, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Duration to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an Any. */
        interface IAny {

            /** Any type_url */
            type_url?: (string|null);

            /** Any value */
            value?: (Uint8Array|null);
        }

        /** Represents an Any. */
        class Any implements IAny {

            /**
             * Constructs a new Any.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IAny);

            /** Any type_url. */
            public type_url: string;

            /** Any value. */
            public value: Uint8Array;

            /**
             * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Any message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

            /**
             * Verifies an Any message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Any message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Any
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

            /**
             * Creates a plain object from an Any message. Also converts values to other types if specified.
             * @param message Any
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Any to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace api. */
    namespace api {

        /** Properties of a Http. */
        interface IHttp {

            /** Http rules */
            rules?: (google.api.IHttpRule[]|null);

            /** Http fully_decode_reserved_expansion */
            fully_decode_reserved_expansion?: (boolean|null);
        }

        /** Represents a Http. */
        class Http implements IHttp {

            /**
             * Constructs a new Http.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttp);

            /** Http rules. */
            public rules: google.api.IHttpRule[];

            /** Http fully_decode_reserved_expansion. */
            public fully_decode_reserved_expansion: boolean;

            /**
             * Encodes the specified Http message. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Http message, length delimited. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Http message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.Http;

            /**
             * Decodes a Http message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.Http;

            /**
             * Verifies a Http message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Http message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Http
             */
            public static fromObject(object: { [k: string]: any }): google.api.Http;

            /**
             * Creates a plain object from a Http message. Also converts values to other types if specified.
             * @param message Http
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.Http, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Http to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a HttpRule. */
        interface IHttpRule {

            /** HttpRule selector */
            selector?: (string|null);

            /** HttpRule get */
            get?: (string|null);

            /** HttpRule put */
            put?: (string|null);

            /** HttpRule post */
            post?: (string|null);

            /** HttpRule delete */
            "delete"?: (string|null);

            /** HttpRule patch */
            patch?: (string|null);

            /** HttpRule custom */
            custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body */
            body?: (string|null);

            /** HttpRule response_body */
            response_body?: (string|null);

            /** HttpRule additional_bindings */
            additional_bindings?: (google.api.IHttpRule[]|null);
        }

        /** Represents a HttpRule. */
        class HttpRule implements IHttpRule {

            /**
             * Constructs a new HttpRule.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttpRule);

            /** HttpRule selector. */
            public selector: string;

            /** HttpRule get. */
            public get?: (string|null);

            /** HttpRule put. */
            public put?: (string|null);

            /** HttpRule post. */
            public post?: (string|null);

            /** HttpRule delete. */
            public delete?: (string|null);

            /** HttpRule patch. */
            public patch?: (string|null);

            /** HttpRule custom. */
            public custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body. */
            public body: string;

            /** HttpRule response_body. */
            public response_body: string;

            /** HttpRule additional_bindings. */
            public additional_bindings: google.api.IHttpRule[];

            /** HttpRule pattern. */
            public pattern?: ("get"|"put"|"post"|"delete"|"patch"|"custom");

            /**
             * Encodes the specified HttpRule message. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HttpRule message, length delimited. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HttpRule message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.HttpRule;

            /**
             * Decodes a HttpRule message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.HttpRule;

            /**
             * Verifies a HttpRule message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HttpRule message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HttpRule
             */
            public static fromObject(object: { [k: string]: any }): google.api.HttpRule;

            /**
             * Creates a plain object from a HttpRule message. Also converts values to other types if specified.
             * @param message HttpRule
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.HttpRule, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HttpRule to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CustomHttpPattern. */
        interface ICustomHttpPattern {

            /** CustomHttpPattern kind */
            kind?: (string|null);

            /** CustomHttpPattern path */
            path?: (string|null);
        }

        /** Represents a CustomHttpPattern. */
        class CustomHttpPattern implements ICustomHttpPattern {

            /**
             * Constructs a new CustomHttpPattern.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.ICustomHttpPattern);

            /** CustomHttpPattern kind. */
            public kind: string;

            /** CustomHttpPattern path. */
            public path: string;

            /**
             * Encodes the specified CustomHttpPattern message. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomHttpPattern message, length delimited. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.CustomHttpPattern;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.CustomHttpPattern;

            /**
             * Verifies a CustomHttpPattern message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomHttpPattern message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomHttpPattern
             */
            public static fromObject(object: { [k: string]: any }): google.api.CustomHttpPattern;

            /**
             * Creates a plain object from a CustomHttpPattern message. Also converts values to other types if specified.
             * @param message CustomHttpPattern
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.CustomHttpPattern, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomHttpPattern to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}

/** Namespace cosmos_proto. */
export namespace cosmos_proto {

    /** Properties of an InterfaceDescriptor. */
    interface IInterfaceDescriptor {

        /** InterfaceDescriptor name */
        name?: (string|null);

        /** InterfaceDescriptor description */
        description?: (string|null);
    }

    /** Represents an InterfaceDescriptor. */
    class InterfaceDescriptor implements IInterfaceDescriptor {

        /**
         * Constructs a new InterfaceDescriptor.
         * @param [properties] Properties to set
         */
        constructor(properties?: cosmos_proto.IInterfaceDescriptor);

        /** InterfaceDescriptor name. */
        public name: string;

        /** InterfaceDescriptor description. */
        public description: string;

        /**
         * Encodes the specified InterfaceDescriptor message. Does not implicitly {@link cosmos_proto.InterfaceDescriptor.verify|verify} messages.
         * @param message InterfaceDescriptor message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cosmos_proto.IInterfaceDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified InterfaceDescriptor message, length delimited. Does not implicitly {@link cosmos_proto.InterfaceDescriptor.verify|verify} messages.
         * @param message InterfaceDescriptor message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cosmos_proto.IInterfaceDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an InterfaceDescriptor message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns InterfaceDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos_proto.InterfaceDescriptor;

        /**
         * Decodes an InterfaceDescriptor message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns InterfaceDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos_proto.InterfaceDescriptor;

        /**
         * Verifies an InterfaceDescriptor message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an InterfaceDescriptor message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns InterfaceDescriptor
         */
        public static fromObject(object: { [k: string]: any }): cosmos_proto.InterfaceDescriptor;

        /**
         * Creates a plain object from an InterfaceDescriptor message. Also converts values to other types if specified.
         * @param message InterfaceDescriptor
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cosmos_proto.InterfaceDescriptor, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this InterfaceDescriptor to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ScalarDescriptor. */
    interface IScalarDescriptor {

        /** ScalarDescriptor name */
        name?: (string|null);

        /** ScalarDescriptor description */
        description?: (string|null);

        /** ScalarDescriptor field_type */
        field_type?: (cosmos_proto.ScalarType[]|null);

        /** ScalarDescriptor legacy_amino_encoding */
        legacy_amino_encoding?: (string|null);
    }

    /** Represents a ScalarDescriptor. */
    class ScalarDescriptor implements IScalarDescriptor {

        /**
         * Constructs a new ScalarDescriptor.
         * @param [properties] Properties to set
         */
        constructor(properties?: cosmos_proto.IScalarDescriptor);

        /** ScalarDescriptor name. */
        public name: string;

        /** ScalarDescriptor description. */
        public description: string;

        /** ScalarDescriptor field_type. */
        public field_type: cosmos_proto.ScalarType[];

        /** ScalarDescriptor legacy_amino_encoding. */
        public legacy_amino_encoding: string;

        /**
         * Encodes the specified ScalarDescriptor message. Does not implicitly {@link cosmos_proto.ScalarDescriptor.verify|verify} messages.
         * @param message ScalarDescriptor message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: cosmos_proto.IScalarDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ScalarDescriptor message, length delimited. Does not implicitly {@link cosmos_proto.ScalarDescriptor.verify|verify} messages.
         * @param message ScalarDescriptor message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: cosmos_proto.IScalarDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ScalarDescriptor message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ScalarDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos_proto.ScalarDescriptor;

        /**
         * Decodes a ScalarDescriptor message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ScalarDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos_proto.ScalarDescriptor;

        /**
         * Verifies a ScalarDescriptor message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ScalarDescriptor message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ScalarDescriptor
         */
        public static fromObject(object: { [k: string]: any }): cosmos_proto.ScalarDescriptor;

        /**
         * Creates a plain object from a ScalarDescriptor message. Also converts values to other types if specified.
         * @param message ScalarDescriptor
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: cosmos_proto.ScalarDescriptor, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ScalarDescriptor to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** ScalarType enum. */
    enum ScalarType {
        SCALAR_TYPE_UNSPECIFIED = 0,
        SCALAR_TYPE_STRING = 1,
        SCALAR_TYPE_BYTES = 2
    }
}

/** Namespace ibc. */
export namespace ibc {

    /** Namespace core. */
    namespace core {

        /** Namespace client. */
        namespace client {

            /** Namespace v1. */
            namespace v1 {

                /** Properties of an IdentifiedClientState. */
                interface IIdentifiedClientState {

                    /** IdentifiedClientState client_id */
                    client_id?: (string|null);

                    /** IdentifiedClientState client_state */
                    client_state?: (google.protobuf.IAny|null);
                }

                /** Represents an IdentifiedClientState. */
                class IdentifiedClientState implements IIdentifiedClientState {

                    /**
                     * Constructs a new IdentifiedClientState.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IIdentifiedClientState);

                    /** IdentifiedClientState client_id. */
                    public client_id: string;

                    /** IdentifiedClientState client_state. */
                    public client_state?: (google.protobuf.IAny|null);

                    /**
                     * Encodes the specified IdentifiedClientState message. Does not implicitly {@link ibc.core.client.v1.IdentifiedClientState.verify|verify} messages.
                     * @param message IdentifiedClientState message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IIdentifiedClientState, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified IdentifiedClientState message, length delimited. Does not implicitly {@link ibc.core.client.v1.IdentifiedClientState.verify|verify} messages.
                     * @param message IdentifiedClientState message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IIdentifiedClientState, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an IdentifiedClientState message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns IdentifiedClientState
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.IdentifiedClientState;

                    /**
                     * Decodes an IdentifiedClientState message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns IdentifiedClientState
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.IdentifiedClientState;

                    /**
                     * Verifies an IdentifiedClientState message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an IdentifiedClientState message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns IdentifiedClientState
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.IdentifiedClientState;

                    /**
                     * Creates a plain object from an IdentifiedClientState message. Also converts values to other types if specified.
                     * @param message IdentifiedClientState
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.IdentifiedClientState, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this IdentifiedClientState to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a ConsensusStateWithHeight. */
                interface IConsensusStateWithHeight {

                    /** ConsensusStateWithHeight height */
                    height?: (ibc.core.client.v1.IHeight|null);

                    /** ConsensusStateWithHeight consensus_state */
                    consensus_state?: (google.protobuf.IAny|null);
                }

                /** Represents a ConsensusStateWithHeight. */
                class ConsensusStateWithHeight implements IConsensusStateWithHeight {

                    /**
                     * Constructs a new ConsensusStateWithHeight.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IConsensusStateWithHeight);

                    /** ConsensusStateWithHeight height. */
                    public height?: (ibc.core.client.v1.IHeight|null);

                    /** ConsensusStateWithHeight consensus_state. */
                    public consensus_state?: (google.protobuf.IAny|null);

                    /**
                     * Encodes the specified ConsensusStateWithHeight message. Does not implicitly {@link ibc.core.client.v1.ConsensusStateWithHeight.verify|verify} messages.
                     * @param message ConsensusStateWithHeight message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IConsensusStateWithHeight, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ConsensusStateWithHeight message, length delimited. Does not implicitly {@link ibc.core.client.v1.ConsensusStateWithHeight.verify|verify} messages.
                     * @param message ConsensusStateWithHeight message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IConsensusStateWithHeight, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ConsensusStateWithHeight message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ConsensusStateWithHeight
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.ConsensusStateWithHeight;

                    /**
                     * Decodes a ConsensusStateWithHeight message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ConsensusStateWithHeight
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.ConsensusStateWithHeight;

                    /**
                     * Verifies a ConsensusStateWithHeight message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ConsensusStateWithHeight message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ConsensusStateWithHeight
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.ConsensusStateWithHeight;

                    /**
                     * Creates a plain object from a ConsensusStateWithHeight message. Also converts values to other types if specified.
                     * @param message ConsensusStateWithHeight
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.ConsensusStateWithHeight, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ConsensusStateWithHeight to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a ClientConsensusStates. */
                interface IClientConsensusStates {

                    /** ClientConsensusStates client_id */
                    client_id?: (string|null);

                    /** ClientConsensusStates consensus_states */
                    consensus_states?: (ibc.core.client.v1.IConsensusStateWithHeight[]|null);
                }

                /** Represents a ClientConsensusStates. */
                class ClientConsensusStates implements IClientConsensusStates {

                    /**
                     * Constructs a new ClientConsensusStates.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IClientConsensusStates);

                    /** ClientConsensusStates client_id. */
                    public client_id: string;

                    /** ClientConsensusStates consensus_states. */
                    public consensus_states: ibc.core.client.v1.IConsensusStateWithHeight[];

                    /**
                     * Encodes the specified ClientConsensusStates message. Does not implicitly {@link ibc.core.client.v1.ClientConsensusStates.verify|verify} messages.
                     * @param message ClientConsensusStates message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IClientConsensusStates, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ClientConsensusStates message, length delimited. Does not implicitly {@link ibc.core.client.v1.ClientConsensusStates.verify|verify} messages.
                     * @param message ClientConsensusStates message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IClientConsensusStates, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ClientConsensusStates message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ClientConsensusStates
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.ClientConsensusStates;

                    /**
                     * Decodes a ClientConsensusStates message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ClientConsensusStates
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.ClientConsensusStates;

                    /**
                     * Verifies a ClientConsensusStates message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ClientConsensusStates message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ClientConsensusStates
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.ClientConsensusStates;

                    /**
                     * Creates a plain object from a ClientConsensusStates message. Also converts values to other types if specified.
                     * @param message ClientConsensusStates
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.ClientConsensusStates, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ClientConsensusStates to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a ClientUpdateProposal. */
                interface IClientUpdateProposal {

                    /** ClientUpdateProposal title */
                    title?: (string|null);

                    /** ClientUpdateProposal description */
                    description?: (string|null);

                    /** ClientUpdateProposal subject_client_id */
                    subject_client_id?: (string|null);

                    /** ClientUpdateProposal substitute_client_id */
                    substitute_client_id?: (string|null);
                }

                /** Represents a ClientUpdateProposal. */
                class ClientUpdateProposal implements IClientUpdateProposal {

                    /**
                     * Constructs a new ClientUpdateProposal.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IClientUpdateProposal);

                    /** ClientUpdateProposal title. */
                    public title: string;

                    /** ClientUpdateProposal description. */
                    public description: string;

                    /** ClientUpdateProposal subject_client_id. */
                    public subject_client_id: string;

                    /** ClientUpdateProposal substitute_client_id. */
                    public substitute_client_id: string;

                    /**
                     * Encodes the specified ClientUpdateProposal message. Does not implicitly {@link ibc.core.client.v1.ClientUpdateProposal.verify|verify} messages.
                     * @param message ClientUpdateProposal message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IClientUpdateProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ClientUpdateProposal message, length delimited. Does not implicitly {@link ibc.core.client.v1.ClientUpdateProposal.verify|verify} messages.
                     * @param message ClientUpdateProposal message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IClientUpdateProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ClientUpdateProposal message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ClientUpdateProposal
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.ClientUpdateProposal;

                    /**
                     * Decodes a ClientUpdateProposal message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ClientUpdateProposal
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.ClientUpdateProposal;

                    /**
                     * Verifies a ClientUpdateProposal message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ClientUpdateProposal message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ClientUpdateProposal
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.ClientUpdateProposal;

                    /**
                     * Creates a plain object from a ClientUpdateProposal message. Also converts values to other types if specified.
                     * @param message ClientUpdateProposal
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.ClientUpdateProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ClientUpdateProposal to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of an UpgradeProposal. */
                interface IUpgradeProposal {

                    /** UpgradeProposal title */
                    title?: (string|null);

                    /** UpgradeProposal description */
                    description?: (string|null);

                    /** UpgradeProposal plan */
                    plan?: (cosmos.upgrade.v1beta1.IPlan|null);

                    /** UpgradeProposal upgraded_client_state */
                    upgraded_client_state?: (google.protobuf.IAny|null);
                }

                /** Represents an UpgradeProposal. */
                class UpgradeProposal implements IUpgradeProposal {

                    /**
                     * Constructs a new UpgradeProposal.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IUpgradeProposal);

                    /** UpgradeProposal title. */
                    public title: string;

                    /** UpgradeProposal description. */
                    public description: string;

                    /** UpgradeProposal plan. */
                    public plan?: (cosmos.upgrade.v1beta1.IPlan|null);

                    /** UpgradeProposal upgraded_client_state. */
                    public upgraded_client_state?: (google.protobuf.IAny|null);

                    /**
                     * Encodes the specified UpgradeProposal message. Does not implicitly {@link ibc.core.client.v1.UpgradeProposal.verify|verify} messages.
                     * @param message UpgradeProposal message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified UpgradeProposal message, length delimited. Does not implicitly {@link ibc.core.client.v1.UpgradeProposal.verify|verify} messages.
                     * @param message UpgradeProposal message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IUpgradeProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an UpgradeProposal message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns UpgradeProposal
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.UpgradeProposal;

                    /**
                     * Decodes an UpgradeProposal message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns UpgradeProposal
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.UpgradeProposal;

                    /**
                     * Verifies an UpgradeProposal message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an UpgradeProposal message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns UpgradeProposal
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.UpgradeProposal;

                    /**
                     * Creates a plain object from an UpgradeProposal message. Also converts values to other types if specified.
                     * @param message UpgradeProposal
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.UpgradeProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this UpgradeProposal to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of an Height. */
                interface IHeight {

                    /** Height revision_number */
                    revision_number?: (Long|null);

                    /** Height revision_height */
                    revision_height?: (Long|null);
                }

                /** Represents an Height. */
                class Height implements IHeight {

                    /**
                     * Constructs a new Height.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IHeight);

                    /** Height revision_number. */
                    public revision_number: Long;

                    /** Height revision_height. */
                    public revision_height: Long;

                    /**
                     * Encodes the specified Height message. Does not implicitly {@link ibc.core.client.v1.Height.verify|verify} messages.
                     * @param message Height message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IHeight, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Height message, length delimited. Does not implicitly {@link ibc.core.client.v1.Height.verify|verify} messages.
                     * @param message Height message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IHeight, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an Height message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Height
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.Height;

                    /**
                     * Decodes an Height message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Height
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.Height;

                    /**
                     * Verifies an Height message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an Height message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Height
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.Height;

                    /**
                     * Creates a plain object from an Height message. Also converts values to other types if specified.
                     * @param message Height
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.Height, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Height to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a Params. */
                interface IParams {

                    /** Params allowed_clients */
                    allowed_clients?: (string[]|null);
                }

                /** Represents a Params. */
                class Params implements IParams {

                    /**
                     * Constructs a new Params.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.core.client.v1.IParams);

                    /** Params allowed_clients. */
                    public allowed_clients: string[];

                    /**
                     * Encodes the specified Params message. Does not implicitly {@link ibc.core.client.v1.Params.verify|verify} messages.
                     * @param message Params message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.core.client.v1.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Params message, length delimited. Does not implicitly {@link ibc.core.client.v1.Params.verify|verify} messages.
                     * @param message Params message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.core.client.v1.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Params message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Params
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.core.client.v1.Params;

                    /**
                     * Decodes a Params message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Params
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.core.client.v1.Params;

                    /**
                     * Verifies a Params message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Params message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Params
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.core.client.v1.Params;

                    /**
                     * Creates a plain object from a Params message. Also converts values to other types if specified.
                     * @param message Params
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.core.client.v1.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Params to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }
        }
    }

    /** Namespace applications. */
    namespace applications {

        /** Namespace transfer. */
        namespace transfer {

            /** Namespace v1. */
            namespace v1 {

                /** Represents a Query */
                class Query extends $protobuf.rpc.Service {

                    /**
                     * Constructs a new Query service.
                     * @param rpcImpl RPC implementation
                     * @param [requestDelimited=false] Whether requests are length-delimited
                     * @param [responseDelimited=false] Whether responses are length-delimited
                     */
                    constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                    /**
                     * Calls DenomTrace.
                     * @param request QueryDenomTraceRequest message or plain object
                     * @param callback Node-style callback called with the error, if any, and QueryDenomTraceResponse
                     */
                    public denomTrace(request: ibc.applications.transfer.v1.IQueryDenomTraceRequest, callback: ibc.applications.transfer.v1.Query.DenomTraceCallback): void;

                    /**
                     * Calls DenomTrace.
                     * @param request QueryDenomTraceRequest message or plain object
                     * @returns Promise
                     */
                    public denomTrace(request: ibc.applications.transfer.v1.IQueryDenomTraceRequest): Promise<ibc.applications.transfer.v1.QueryDenomTraceResponse>;

                    /**
                     * Calls DenomTraces.
                     * @param request QueryDenomTracesRequest message or plain object
                     * @param callback Node-style callback called with the error, if any, and QueryDenomTracesResponse
                     */
                    public denomTraces(request: ibc.applications.transfer.v1.IQueryDenomTracesRequest, callback: ibc.applications.transfer.v1.Query.DenomTracesCallback): void;

                    /**
                     * Calls DenomTraces.
                     * @param request QueryDenomTracesRequest message or plain object
                     * @returns Promise
                     */
                    public denomTraces(request: ibc.applications.transfer.v1.IQueryDenomTracesRequest): Promise<ibc.applications.transfer.v1.QueryDenomTracesResponse>;

                    /**
                     * Calls Params.
                     * @param request QueryParamsRequest message or plain object
                     * @param callback Node-style callback called with the error, if any, and QueryParamsResponse
                     */
                    public params(request: ibc.applications.transfer.v1.IQueryParamsRequest, callback: ibc.applications.transfer.v1.Query.ParamsCallback): void;

                    /**
                     * Calls Params.
                     * @param request QueryParamsRequest message or plain object
                     * @returns Promise
                     */
                    public params(request: ibc.applications.transfer.v1.IQueryParamsRequest): Promise<ibc.applications.transfer.v1.QueryParamsResponse>;

                    /**
                     * Calls DenomHash.
                     * @param request QueryDenomHashRequest message or plain object
                     * @param callback Node-style callback called with the error, if any, and QueryDenomHashResponse
                     */
                    public denomHash(request: ibc.applications.transfer.v1.IQueryDenomHashRequest, callback: ibc.applications.transfer.v1.Query.DenomHashCallback): void;

                    /**
                     * Calls DenomHash.
                     * @param request QueryDenomHashRequest message or plain object
                     * @returns Promise
                     */
                    public denomHash(request: ibc.applications.transfer.v1.IQueryDenomHashRequest): Promise<ibc.applications.transfer.v1.QueryDenomHashResponse>;

                    /**
                     * Calls EscrowAddress.
                     * @param request QueryEscrowAddressRequest message or plain object
                     * @param callback Node-style callback called with the error, if any, and QueryEscrowAddressResponse
                     */
                    public escrowAddress(request: ibc.applications.transfer.v1.IQueryEscrowAddressRequest, callback: ibc.applications.transfer.v1.Query.EscrowAddressCallback): void;

                    /**
                     * Calls EscrowAddress.
                     * @param request QueryEscrowAddressRequest message or plain object
                     * @returns Promise
                     */
                    public escrowAddress(request: ibc.applications.transfer.v1.IQueryEscrowAddressRequest): Promise<ibc.applications.transfer.v1.QueryEscrowAddressResponse>;
                }

                namespace Query {

                    /**
                     * Callback as used by {@link ibc.applications.transfer.v1.Query#denomTrace}.
                     * @param error Error, if any
                     * @param [response] QueryDenomTraceResponse
                     */
                    type DenomTraceCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomTraceResponse) => void;

                    /**
                     * Callback as used by {@link ibc.applications.transfer.v1.Query#denomTraces}.
                     * @param error Error, if any
                     * @param [response] QueryDenomTracesResponse
                     */
                    type DenomTracesCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomTracesResponse) => void;

                    /**
                     * Callback as used by {@link ibc.applications.transfer.v1.Query#params}.
                     * @param error Error, if any
                     * @param [response] QueryParamsResponse
                     */
                    type ParamsCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryParamsResponse) => void;

                    /**
                     * Callback as used by {@link ibc.applications.transfer.v1.Query#denomHash}.
                     * @param error Error, if any
                     * @param [response] QueryDenomHashResponse
                     */
                    type DenomHashCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryDenomHashResponse) => void;

                    /**
                     * Callback as used by {@link ibc.applications.transfer.v1.Query#escrowAddress}.
                     * @param error Error, if any
                     * @param [response] QueryEscrowAddressResponse
                     */
                    type EscrowAddressCallback = (error: (Error|null), response?: ibc.applications.transfer.v1.QueryEscrowAddressResponse) => void;
                }

                /** Properties of a QueryDenomTraceRequest. */
                interface IQueryDenomTraceRequest {

                    /** QueryDenomTraceRequest hash */
                    hash?: (string|null);
                }

                /** Represents a QueryDenomTraceRequest. */
                class QueryDenomTraceRequest implements IQueryDenomTraceRequest {

                    /**
                     * Constructs a new QueryDenomTraceRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomTraceRequest);

                    /** QueryDenomTraceRequest hash. */
                    public hash: string;

                    /**
                     * Encodes the specified QueryDenomTraceRequest message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTraceRequest.verify|verify} messages.
                     * @param message QueryDenomTraceRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomTraceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomTraceRequest message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTraceRequest.verify|verify} messages.
                     * @param message QueryDenomTraceRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomTraceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomTraceRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomTraceRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomTraceRequest;

                    /**
                     * Decodes a QueryDenomTraceRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomTraceRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomTraceRequest;

                    /**
                     * Verifies a QueryDenomTraceRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomTraceRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomTraceRequest
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomTraceRequest;

                    /**
                     * Creates a plain object from a QueryDenomTraceRequest message. Also converts values to other types if specified.
                     * @param message QueryDenomTraceRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomTraceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomTraceRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryDenomTraceResponse. */
                interface IQueryDenomTraceResponse {

                    /** QueryDenomTraceResponse denom_trace */
                    denom_trace?: (ibc.applications.transfer.v1.IDenomTrace|null);
                }

                /** Represents a QueryDenomTraceResponse. */
                class QueryDenomTraceResponse implements IQueryDenomTraceResponse {

                    /**
                     * Constructs a new QueryDenomTraceResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomTraceResponse);

                    /** QueryDenomTraceResponse denom_trace. */
                    public denom_trace?: (ibc.applications.transfer.v1.IDenomTrace|null);

                    /**
                     * Encodes the specified QueryDenomTraceResponse message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTraceResponse.verify|verify} messages.
                     * @param message QueryDenomTraceResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomTraceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomTraceResponse message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTraceResponse.verify|verify} messages.
                     * @param message QueryDenomTraceResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomTraceResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomTraceResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomTraceResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomTraceResponse;

                    /**
                     * Decodes a QueryDenomTraceResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomTraceResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomTraceResponse;

                    /**
                     * Verifies a QueryDenomTraceResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomTraceResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomTraceResponse
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomTraceResponse;

                    /**
                     * Creates a plain object from a QueryDenomTraceResponse message. Also converts values to other types if specified.
                     * @param message QueryDenomTraceResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomTraceResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomTraceResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryDenomTracesRequest. */
                interface IQueryDenomTracesRequest {

                    /** QueryDenomTracesRequest pagination */
                    pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);
                }

                /** Represents a QueryDenomTracesRequest. */
                class QueryDenomTracesRequest implements IQueryDenomTracesRequest {

                    /**
                     * Constructs a new QueryDenomTracesRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomTracesRequest);

                    /** QueryDenomTracesRequest pagination. */
                    public pagination?: (cosmos.base.query.v1beta1.IPageRequest|null);

                    /**
                     * Encodes the specified QueryDenomTracesRequest message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTracesRequest.verify|verify} messages.
                     * @param message QueryDenomTracesRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomTracesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomTracesRequest message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTracesRequest.verify|verify} messages.
                     * @param message QueryDenomTracesRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomTracesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomTracesRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomTracesRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomTracesRequest;

                    /**
                     * Decodes a QueryDenomTracesRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomTracesRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomTracesRequest;

                    /**
                     * Verifies a QueryDenomTracesRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomTracesRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomTracesRequest
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomTracesRequest;

                    /**
                     * Creates a plain object from a QueryDenomTracesRequest message. Also converts values to other types if specified.
                     * @param message QueryDenomTracesRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomTracesRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomTracesRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryDenomTracesResponse. */
                interface IQueryDenomTracesResponse {

                    /** QueryDenomTracesResponse denom_traces */
                    denom_traces?: (ibc.applications.transfer.v1.IDenomTrace[]|null);

                    /** QueryDenomTracesResponse pagination */
                    pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);
                }

                /** Represents a QueryDenomTracesResponse. */
                class QueryDenomTracesResponse implements IQueryDenomTracesResponse {

                    /**
                     * Constructs a new QueryDenomTracesResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomTracesResponse);

                    /** QueryDenomTracesResponse denom_traces. */
                    public denom_traces: ibc.applications.transfer.v1.IDenomTrace[];

                    /** QueryDenomTracesResponse pagination. */
                    public pagination?: (cosmos.base.query.v1beta1.IPageResponse|null);

                    /**
                     * Encodes the specified QueryDenomTracesResponse message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTracesResponse.verify|verify} messages.
                     * @param message QueryDenomTracesResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomTracesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomTracesResponse message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomTracesResponse.verify|verify} messages.
                     * @param message QueryDenomTracesResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomTracesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomTracesResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomTracesResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomTracesResponse;

                    /**
                     * Decodes a QueryDenomTracesResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomTracesResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomTracesResponse;

                    /**
                     * Verifies a QueryDenomTracesResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomTracesResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomTracesResponse
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomTracesResponse;

                    /**
                     * Creates a plain object from a QueryDenomTracesResponse message. Also converts values to other types if specified.
                     * @param message QueryDenomTracesResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomTracesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomTracesResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryParamsRequest. */
                interface IQueryParamsRequest {
                }

                /** Represents a QueryParamsRequest. */
                class QueryParamsRequest implements IQueryParamsRequest {

                    /**
                     * Constructs a new QueryParamsRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryParamsRequest);

                    /**
                     * Encodes the specified QueryParamsRequest message. Does not implicitly {@link ibc.applications.transfer.v1.QueryParamsRequest.verify|verify} messages.
                     * @param message QueryParamsRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryParamsRequest.verify|verify} messages.
                     * @param message QueryParamsRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryParamsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryParamsRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryParamsRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryParamsRequest;

                    /**
                     * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryParamsRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryParamsRequest;

                    /**
                     * Verifies a QueryParamsRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryParamsRequest
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryParamsRequest;

                    /**
                     * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
                     * @param message QueryParamsRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryParamsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryParamsRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryParamsResponse. */
                interface IQueryParamsResponse {

                    /** QueryParamsResponse params */
                    params?: (ibc.applications.transfer.v1.IParams|null);
                }

                /** Represents a QueryParamsResponse. */
                class QueryParamsResponse implements IQueryParamsResponse {

                    /**
                     * Constructs a new QueryParamsResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryParamsResponse);

                    /** QueryParamsResponse params. */
                    public params?: (ibc.applications.transfer.v1.IParams|null);

                    /**
                     * Encodes the specified QueryParamsResponse message. Does not implicitly {@link ibc.applications.transfer.v1.QueryParamsResponse.verify|verify} messages.
                     * @param message QueryParamsResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryParamsResponse.verify|verify} messages.
                     * @param message QueryParamsResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryParamsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryParamsResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryParamsResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryParamsResponse;

                    /**
                     * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryParamsResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryParamsResponse;

                    /**
                     * Verifies a QueryParamsResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryParamsResponse
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryParamsResponse;

                    /**
                     * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
                     * @param message QueryParamsResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryParamsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryParamsResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryDenomHashRequest. */
                interface IQueryDenomHashRequest {

                    /** QueryDenomHashRequest trace */
                    trace?: (string|null);
                }

                /** Represents a QueryDenomHashRequest. */
                class QueryDenomHashRequest implements IQueryDenomHashRequest {

                    /**
                     * Constructs a new QueryDenomHashRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomHashRequest);

                    /** QueryDenomHashRequest trace. */
                    public trace: string;

                    /**
                     * Encodes the specified QueryDenomHashRequest message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomHashRequest.verify|verify} messages.
                     * @param message QueryDenomHashRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomHashRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomHashRequest message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomHashRequest.verify|verify} messages.
                     * @param message QueryDenomHashRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomHashRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomHashRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomHashRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomHashRequest;

                    /**
                     * Decodes a QueryDenomHashRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomHashRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomHashRequest;

                    /**
                     * Verifies a QueryDenomHashRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomHashRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomHashRequest
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomHashRequest;

                    /**
                     * Creates a plain object from a QueryDenomHashRequest message. Also converts values to other types if specified.
                     * @param message QueryDenomHashRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomHashRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomHashRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryDenomHashResponse. */
                interface IQueryDenomHashResponse {

                    /** QueryDenomHashResponse hash */
                    hash?: (string|null);
                }

                /** Represents a QueryDenomHashResponse. */
                class QueryDenomHashResponse implements IQueryDenomHashResponse {

                    /**
                     * Constructs a new QueryDenomHashResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryDenomHashResponse);

                    /** QueryDenomHashResponse hash. */
                    public hash: string;

                    /**
                     * Encodes the specified QueryDenomHashResponse message. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomHashResponse.verify|verify} messages.
                     * @param message QueryDenomHashResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryDenomHashResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryDenomHashResponse message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryDenomHashResponse.verify|verify} messages.
                     * @param message QueryDenomHashResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryDenomHashResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryDenomHashResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryDenomHashResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryDenomHashResponse;

                    /**
                     * Decodes a QueryDenomHashResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryDenomHashResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryDenomHashResponse;

                    /**
                     * Verifies a QueryDenomHashResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryDenomHashResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryDenomHashResponse
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryDenomHashResponse;

                    /**
                     * Creates a plain object from a QueryDenomHashResponse message. Also converts values to other types if specified.
                     * @param message QueryDenomHashResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryDenomHashResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryDenomHashResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryEscrowAddressRequest. */
                interface IQueryEscrowAddressRequest {

                    /** QueryEscrowAddressRequest port_id */
                    port_id?: (string|null);

                    /** QueryEscrowAddressRequest channel_id */
                    channel_id?: (string|null);
                }

                /** Represents a QueryEscrowAddressRequest. */
                class QueryEscrowAddressRequest implements IQueryEscrowAddressRequest {

                    /**
                     * Constructs a new QueryEscrowAddressRequest.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryEscrowAddressRequest);

                    /** QueryEscrowAddressRequest port_id. */
                    public port_id: string;

                    /** QueryEscrowAddressRequest channel_id. */
                    public channel_id: string;

                    /**
                     * Encodes the specified QueryEscrowAddressRequest message. Does not implicitly {@link ibc.applications.transfer.v1.QueryEscrowAddressRequest.verify|verify} messages.
                     * @param message QueryEscrowAddressRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryEscrowAddressRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryEscrowAddressRequest message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryEscrowAddressRequest.verify|verify} messages.
                     * @param message QueryEscrowAddressRequest message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryEscrowAddressRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryEscrowAddressRequest message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryEscrowAddressRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryEscrowAddressRequest;

                    /**
                     * Decodes a QueryEscrowAddressRequest message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryEscrowAddressRequest
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryEscrowAddressRequest;

                    /**
                     * Verifies a QueryEscrowAddressRequest message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryEscrowAddressRequest message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryEscrowAddressRequest
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryEscrowAddressRequest;

                    /**
                     * Creates a plain object from a QueryEscrowAddressRequest message. Also converts values to other types if specified.
                     * @param message QueryEscrowAddressRequest
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryEscrowAddressRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryEscrowAddressRequest to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a QueryEscrowAddressResponse. */
                interface IQueryEscrowAddressResponse {

                    /** QueryEscrowAddressResponse escrow_address */
                    escrow_address?: (string|null);
                }

                /** Represents a QueryEscrowAddressResponse. */
                class QueryEscrowAddressResponse implements IQueryEscrowAddressResponse {

                    /**
                     * Constructs a new QueryEscrowAddressResponse.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IQueryEscrowAddressResponse);

                    /** QueryEscrowAddressResponse escrow_address. */
                    public escrow_address: string;

                    /**
                     * Encodes the specified QueryEscrowAddressResponse message. Does not implicitly {@link ibc.applications.transfer.v1.QueryEscrowAddressResponse.verify|verify} messages.
                     * @param message QueryEscrowAddressResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IQueryEscrowAddressResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryEscrowAddressResponse message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.QueryEscrowAddressResponse.verify|verify} messages.
                     * @param message QueryEscrowAddressResponse message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IQueryEscrowAddressResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryEscrowAddressResponse message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryEscrowAddressResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.QueryEscrowAddressResponse;

                    /**
                     * Decodes a QueryEscrowAddressResponse message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryEscrowAddressResponse
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.QueryEscrowAddressResponse;

                    /**
                     * Verifies a QueryEscrowAddressResponse message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryEscrowAddressResponse message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryEscrowAddressResponse
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.QueryEscrowAddressResponse;

                    /**
                     * Creates a plain object from a QueryEscrowAddressResponse message. Also converts values to other types if specified.
                     * @param message QueryEscrowAddressResponse
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.QueryEscrowAddressResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryEscrowAddressResponse to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a DenomTrace. */
                interface IDenomTrace {

                    /** DenomTrace path */
                    path?: (string|null);

                    /** DenomTrace base_denom */
                    base_denom?: (string|null);
                }

                /** Represents a DenomTrace. */
                class DenomTrace implements IDenomTrace {

                    /**
                     * Constructs a new DenomTrace.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IDenomTrace);

                    /** DenomTrace path. */
                    public path: string;

                    /** DenomTrace base_denom. */
                    public base_denom: string;

                    /**
                     * Encodes the specified DenomTrace message. Does not implicitly {@link ibc.applications.transfer.v1.DenomTrace.verify|verify} messages.
                     * @param message DenomTrace message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IDenomTrace, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified DenomTrace message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.DenomTrace.verify|verify} messages.
                     * @param message DenomTrace message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IDenomTrace, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a DenomTrace message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns DenomTrace
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.DenomTrace;

                    /**
                     * Decodes a DenomTrace message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns DenomTrace
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.DenomTrace;

                    /**
                     * Verifies a DenomTrace message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a DenomTrace message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns DenomTrace
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.DenomTrace;

                    /**
                     * Creates a plain object from a DenomTrace message. Also converts values to other types if specified.
                     * @param message DenomTrace
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.DenomTrace, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this DenomTrace to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a Params. */
                interface IParams {

                    /** Params send_enabled */
                    send_enabled?: (boolean|null);

                    /** Params receive_enabled */
                    receive_enabled?: (boolean|null);
                }

                /** Represents a Params. */
                class Params implements IParams {

                    /**
                     * Constructs a new Params.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: ibc.applications.transfer.v1.IParams);

                    /** Params send_enabled. */
                    public send_enabled: boolean;

                    /** Params receive_enabled. */
                    public receive_enabled: boolean;

                    /**
                     * Encodes the specified Params message. Does not implicitly {@link ibc.applications.transfer.v1.Params.verify|verify} messages.
                     * @param message Params message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: ibc.applications.transfer.v1.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Params message, length delimited. Does not implicitly {@link ibc.applications.transfer.v1.Params.verify|verify} messages.
                     * @param message Params message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: ibc.applications.transfer.v1.IParams, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Params message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Params
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ibc.applications.transfer.v1.Params;

                    /**
                     * Decodes a Params message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Params
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ibc.applications.transfer.v1.Params;

                    /**
                     * Verifies a Params message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Params message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Params
                     */
                    public static fromObject(object: { [k: string]: any }): ibc.applications.transfer.v1.Params;

                    /**
                     * Creates a plain object from a Params message. Also converts values to other types if specified.
                     * @param message Params
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: ibc.applications.transfer.v1.Params, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Params to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }
        }
    }
}
