import * as $protobuf from "protobufjs";
/** Namespace cosmos. */
export namespace cosmos {

    /** Namespace adminmodule. */
    namespace adminmodule {

        /** Namespace adminmodule. */
        namespace adminmodule {

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
                 * Calls DeleteAdmin.
                 * @param request MsgDeleteAdmin message or plain object
                 * @param callback Node-style callback called with the error, if any, and MsgDeleteAdminResponse
                 */
                public deleteAdmin(request: cosmos.adminmodule.adminmodule.IMsgDeleteAdmin, callback: cosmos.adminmodule.adminmodule.Msg.DeleteAdminCallback): void;

                /**
                 * Calls DeleteAdmin.
                 * @param request MsgDeleteAdmin message or plain object
                 * @returns Promise
                 */
                public deleteAdmin(request: cosmos.adminmodule.adminmodule.IMsgDeleteAdmin): Promise<cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse>;

                /**
                 * Calls AddAdmin.
                 * @param request MsgAddAdmin message or plain object
                 * @param callback Node-style callback called with the error, if any, and MsgAddAdminResponse
                 */
                public addAdmin(request: cosmos.adminmodule.adminmodule.IMsgAddAdmin, callback: cosmos.adminmodule.adminmodule.Msg.AddAdminCallback): void;

                /**
                 * Calls AddAdmin.
                 * @param request MsgAddAdmin message or plain object
                 * @returns Promise
                 */
                public addAdmin(request: cosmos.adminmodule.adminmodule.IMsgAddAdmin): Promise<cosmos.adminmodule.adminmodule.MsgAddAdminResponse>;

                /**
                 * Calls SubmitProposal.
                 * @param request MsgSubmitProposal message or plain object
                 * @param callback Node-style callback called with the error, if any, and MsgSubmitProposalResponse
                 */
                public submitProposal(request: cosmos.adminmodule.adminmodule.IMsgSubmitProposal, callback: cosmos.adminmodule.adminmodule.Msg.SubmitProposalCallback): void;

                /**
                 * Calls SubmitProposal.
                 * @param request MsgSubmitProposal message or plain object
                 * @returns Promise
                 */
                public submitProposal(request: cosmos.adminmodule.adminmodule.IMsgSubmitProposal): Promise<cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse>;
            }

            namespace Msg {

                /**
                 * Callback as used by {@link cosmos.adminmodule.adminmodule.Msg#deleteAdmin}.
                 * @param error Error, if any
                 * @param [response] MsgDeleteAdminResponse
                 */
                type DeleteAdminCallback = (error: (Error|null), response?: cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse) => void;

                /**
                 * Callback as used by {@link cosmos.adminmodule.adminmodule.Msg#addAdmin}.
                 * @param error Error, if any
                 * @param [response] MsgAddAdminResponse
                 */
                type AddAdminCallback = (error: (Error|null), response?: cosmos.adminmodule.adminmodule.MsgAddAdminResponse) => void;

                /**
                 * Callback as used by {@link cosmos.adminmodule.adminmodule.Msg#submitProposal}.
                 * @param error Error, if any
                 * @param [response] MsgSubmitProposalResponse
                 */
                type SubmitProposalCallback = (error: (Error|null), response?: cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse) => void;
            }

            /** Properties of a MsgDeleteAdmin. */
            interface IMsgDeleteAdmin {

                /** MsgDeleteAdmin creator */
                creator?: (string|null);

                /** MsgDeleteAdmin admin */
                admin?: (string|null);
            }

            /** Represents a MsgDeleteAdmin. */
            class MsgDeleteAdmin implements IMsgDeleteAdmin {

                /**
                 * Constructs a new MsgDeleteAdmin.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgDeleteAdmin);

                /** MsgDeleteAdmin creator. */
                public creator: string;

                /** MsgDeleteAdmin admin. */
                public admin: string;

                /**
                 * Encodes the specified MsgDeleteAdmin message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgDeleteAdmin.verify|verify} messages.
                 * @param message MsgDeleteAdmin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgDeleteAdmin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgDeleteAdmin message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgDeleteAdmin.verify|verify} messages.
                 * @param message MsgDeleteAdmin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgDeleteAdmin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgDeleteAdmin message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgDeleteAdmin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgDeleteAdmin;

                /**
                 * Decodes a MsgDeleteAdmin message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgDeleteAdmin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgDeleteAdmin;

                /**
                 * Verifies a MsgDeleteAdmin message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgDeleteAdmin message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgDeleteAdmin
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgDeleteAdmin;

                /**
                 * Creates a plain object from a MsgDeleteAdmin message. Also converts values to other types if specified.
                 * @param message MsgDeleteAdmin
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgDeleteAdmin, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgDeleteAdmin to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgDeleteAdminResponse. */
            interface IMsgDeleteAdminResponse {
            }

            /** Represents a MsgDeleteAdminResponse. */
            class MsgDeleteAdminResponse implements IMsgDeleteAdminResponse {

                /**
                 * Constructs a new MsgDeleteAdminResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgDeleteAdminResponse);

                /**
                 * Encodes the specified MsgDeleteAdminResponse message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse.verify|verify} messages.
                 * @param message MsgDeleteAdminResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgDeleteAdminResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgDeleteAdminResponse message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse.verify|verify} messages.
                 * @param message MsgDeleteAdminResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgDeleteAdminResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgDeleteAdminResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgDeleteAdminResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse;

                /**
                 * Decodes a MsgDeleteAdminResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgDeleteAdminResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse;

                /**
                 * Verifies a MsgDeleteAdminResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgDeleteAdminResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgDeleteAdminResponse
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse;

                /**
                 * Creates a plain object from a MsgDeleteAdminResponse message. Also converts values to other types if specified.
                 * @param message MsgDeleteAdminResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgDeleteAdminResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgDeleteAdminResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgAddAdmin. */
            interface IMsgAddAdmin {

                /** MsgAddAdmin creator */
                creator?: (string|null);

                /** MsgAddAdmin admin */
                admin?: (string|null);
            }

            /** Represents a MsgAddAdmin. */
            class MsgAddAdmin implements IMsgAddAdmin {

                /**
                 * Constructs a new MsgAddAdmin.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgAddAdmin);

                /** MsgAddAdmin creator. */
                public creator: string;

                /** MsgAddAdmin admin. */
                public admin: string;

                /**
                 * Encodes the specified MsgAddAdmin message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgAddAdmin.verify|verify} messages.
                 * @param message MsgAddAdmin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgAddAdmin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgAddAdmin message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgAddAdmin.verify|verify} messages.
                 * @param message MsgAddAdmin message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgAddAdmin, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgAddAdmin message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgAddAdmin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgAddAdmin;

                /**
                 * Decodes a MsgAddAdmin message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgAddAdmin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgAddAdmin;

                /**
                 * Verifies a MsgAddAdmin message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgAddAdmin message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgAddAdmin
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgAddAdmin;

                /**
                 * Creates a plain object from a MsgAddAdmin message. Also converts values to other types if specified.
                 * @param message MsgAddAdmin
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgAddAdmin, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgAddAdmin to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgAddAdminResponse. */
            interface IMsgAddAdminResponse {
            }

            /** Represents a MsgAddAdminResponse. */
            class MsgAddAdminResponse implements IMsgAddAdminResponse {

                /**
                 * Constructs a new MsgAddAdminResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgAddAdminResponse);

                /**
                 * Encodes the specified MsgAddAdminResponse message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgAddAdminResponse.verify|verify} messages.
                 * @param message MsgAddAdminResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgAddAdminResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgAddAdminResponse message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgAddAdminResponse.verify|verify} messages.
                 * @param message MsgAddAdminResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgAddAdminResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgAddAdminResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgAddAdminResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgAddAdminResponse;

                /**
                 * Decodes a MsgAddAdminResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgAddAdminResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgAddAdminResponse;

                /**
                 * Verifies a MsgAddAdminResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgAddAdminResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgAddAdminResponse
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgAddAdminResponse;

                /**
                 * Creates a plain object from a MsgAddAdminResponse message. Also converts values to other types if specified.
                 * @param message MsgAddAdminResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgAddAdminResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgAddAdminResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgSubmitProposal. */
            interface IMsgSubmitProposal {

                /** MsgSubmitProposal content */
                content?: (google.protobuf.IAny|null);

                /** MsgSubmitProposal proposer */
                proposer?: (string|null);
            }

            /** Represents a MsgSubmitProposal. */
            class MsgSubmitProposal implements IMsgSubmitProposal {

                /**
                 * Constructs a new MsgSubmitProposal.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgSubmitProposal);

                /** MsgSubmitProposal content. */
                public content?: (google.protobuf.IAny|null);

                /** MsgSubmitProposal proposer. */
                public proposer: string;

                /**
                 * Encodes the specified MsgSubmitProposal message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgSubmitProposal.verify|verify} messages.
                 * @param message MsgSubmitProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgSubmitProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgSubmitProposal message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgSubmitProposal.verify|verify} messages.
                 * @param message MsgSubmitProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgSubmitProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgSubmitProposal message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgSubmitProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgSubmitProposal;

                /**
                 * Decodes a MsgSubmitProposal message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgSubmitProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgSubmitProposal;

                /**
                 * Verifies a MsgSubmitProposal message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgSubmitProposal message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgSubmitProposal
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgSubmitProposal;

                /**
                 * Creates a plain object from a MsgSubmitProposal message. Also converts values to other types if specified.
                 * @param message MsgSubmitProposal
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgSubmitProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgSubmitProposal to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a MsgSubmitProposalResponse. */
            interface IMsgSubmitProposalResponse {

                /** MsgSubmitProposalResponse proposal_id */
                proposal_id?: (Long|null);
            }

            /** Represents a MsgSubmitProposalResponse. */
            class MsgSubmitProposalResponse implements IMsgSubmitProposalResponse {

                /**
                 * Constructs a new MsgSubmitProposalResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IMsgSubmitProposalResponse);

                /** MsgSubmitProposalResponse proposal_id. */
                public proposal_id: Long;

                /**
                 * Encodes the specified MsgSubmitProposalResponse message. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse.verify|verify} messages.
                 * @param message MsgSubmitProposalResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IMsgSubmitProposalResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified MsgSubmitProposalResponse message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse.verify|verify} messages.
                 * @param message MsgSubmitProposalResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IMsgSubmitProposalResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a MsgSubmitProposalResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns MsgSubmitProposalResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse;

                /**
                 * Decodes a MsgSubmitProposalResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns MsgSubmitProposalResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse;

                /**
                 * Verifies a MsgSubmitProposalResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a MsgSubmitProposalResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns MsgSubmitProposalResponse
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse;

                /**
                 * Creates a plain object from a MsgSubmitProposalResponse message. Also converts values to other types if specified.
                 * @param message MsgSubmitProposalResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.MsgSubmitProposalResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this MsgSubmitProposalResponse to JSON.
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
                 * Calls Admins.
                 * @param request QueryAdminsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and QueryAdminsResponse
                 */
                public admins(request: cosmos.adminmodule.adminmodule.IQueryAdminsRequest, callback: cosmos.adminmodule.adminmodule.Query.AdminsCallback): void;

                /**
                 * Calls Admins.
                 * @param request QueryAdminsRequest message or plain object
                 * @returns Promise
                 */
                public admins(request: cosmos.adminmodule.adminmodule.IQueryAdminsRequest): Promise<cosmos.adminmodule.adminmodule.QueryAdminsResponse>;

                /**
                 * Calls ArchivedProposals.
                 * @param request QueryArchivedProposalsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and QueryArchivedProposalsResponse
                 */
                public archivedProposals(request: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsRequest, callback: cosmos.adminmodule.adminmodule.Query.ArchivedProposalsCallback): void;

                /**
                 * Calls ArchivedProposals.
                 * @param request QueryArchivedProposalsRequest message or plain object
                 * @returns Promise
                 */
                public archivedProposals(request: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsRequest): Promise<cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse>;
            }

            namespace Query {

                /**
                 * Callback as used by {@link cosmos.adminmodule.adminmodule.Query#admins}.
                 * @param error Error, if any
                 * @param [response] QueryAdminsResponse
                 */
                type AdminsCallback = (error: (Error|null), response?: cosmos.adminmodule.adminmodule.QueryAdminsResponse) => void;

                /**
                 * Callback as used by {@link cosmos.adminmodule.adminmodule.Query#archivedProposals}.
                 * @param error Error, if any
                 * @param [response] QueryArchivedProposalsResponse
                 */
                type ArchivedProposalsCallback = (error: (Error|null), response?: cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse) => void;
            }

            /** Properties of a QueryAdminsRequest. */
            interface IQueryAdminsRequest {
            }

            /** Represents a QueryAdminsRequest. */
            class QueryAdminsRequest implements IQueryAdminsRequest {

                /**
                 * Constructs a new QueryAdminsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IQueryAdminsRequest);

                /**
                 * Encodes the specified QueryAdminsRequest message. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryAdminsRequest.verify|verify} messages.
                 * @param message QueryAdminsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IQueryAdminsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified QueryAdminsRequest message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryAdminsRequest.verify|verify} messages.
                 * @param message QueryAdminsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IQueryAdminsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a QueryAdminsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns QueryAdminsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.QueryAdminsRequest;

                /**
                 * Decodes a QueryAdminsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns QueryAdminsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.QueryAdminsRequest;

                /**
                 * Verifies a QueryAdminsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a QueryAdminsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns QueryAdminsRequest
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.QueryAdminsRequest;

                /**
                 * Creates a plain object from a QueryAdminsRequest message. Also converts values to other types if specified.
                 * @param message QueryAdminsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.QueryAdminsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this QueryAdminsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a QueryAdminsResponse. */
            interface IQueryAdminsResponse {

                /** QueryAdminsResponse admins */
                admins?: (string[]|null);
            }

            /** Represents a QueryAdminsResponse. */
            class QueryAdminsResponse implements IQueryAdminsResponse {

                /**
                 * Constructs a new QueryAdminsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IQueryAdminsResponse);

                /** QueryAdminsResponse admins. */
                public admins: string[];

                /**
                 * Encodes the specified QueryAdminsResponse message. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryAdminsResponse.verify|verify} messages.
                 * @param message QueryAdminsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IQueryAdminsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified QueryAdminsResponse message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryAdminsResponse.verify|verify} messages.
                 * @param message QueryAdminsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IQueryAdminsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a QueryAdminsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns QueryAdminsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.QueryAdminsResponse;

                /**
                 * Decodes a QueryAdminsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns QueryAdminsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.QueryAdminsResponse;

                /**
                 * Verifies a QueryAdminsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a QueryAdminsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns QueryAdminsResponse
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.QueryAdminsResponse;

                /**
                 * Creates a plain object from a QueryAdminsResponse message. Also converts values to other types if specified.
                 * @param message QueryAdminsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.QueryAdminsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this QueryAdminsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a QueryArchivedProposalsRequest. */
            interface IQueryArchivedProposalsRequest {
            }

            /** Represents a QueryArchivedProposalsRequest. */
            class QueryArchivedProposalsRequest implements IQueryArchivedProposalsRequest {

                /**
                 * Constructs a new QueryArchivedProposalsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsRequest);

                /**
                 * Encodes the specified QueryArchivedProposalsRequest message. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest.verify|verify} messages.
                 * @param message QueryArchivedProposalsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified QueryArchivedProposalsRequest message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest.verify|verify} messages.
                 * @param message QueryArchivedProposalsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a QueryArchivedProposalsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns QueryArchivedProposalsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest;

                /**
                 * Decodes a QueryArchivedProposalsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns QueryArchivedProposalsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest;

                /**
                 * Verifies a QueryArchivedProposalsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a QueryArchivedProposalsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns QueryArchivedProposalsRequest
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest;

                /**
                 * Creates a plain object from a QueryArchivedProposalsRequest message. Also converts values to other types if specified.
                 * @param message QueryArchivedProposalsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.QueryArchivedProposalsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this QueryArchivedProposalsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a QueryArchivedProposalsResponse. */
            interface IQueryArchivedProposalsResponse {

                /** QueryArchivedProposalsResponse proposals */
                proposals?: (cosmos.gov.v1beta1.IProposal[]|null);
            }

            /** Represents a QueryArchivedProposalsResponse. */
            class QueryArchivedProposalsResponse implements IQueryArchivedProposalsResponse {

                /**
                 * Constructs a new QueryArchivedProposalsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsResponse);

                /** QueryArchivedProposalsResponse proposals. */
                public proposals: cosmos.gov.v1beta1.IProposal[];

                /**
                 * Encodes the specified QueryArchivedProposalsResponse message. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse.verify|verify} messages.
                 * @param message QueryArchivedProposalsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified QueryArchivedProposalsResponse message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse.verify|verify} messages.
                 * @param message QueryArchivedProposalsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IQueryArchivedProposalsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a QueryArchivedProposalsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns QueryArchivedProposalsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse;

                /**
                 * Decodes a QueryArchivedProposalsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns QueryArchivedProposalsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse;

                /**
                 * Verifies a QueryArchivedProposalsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a QueryArchivedProposalsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns QueryArchivedProposalsResponse
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse;

                /**
                 * Creates a plain object from a QueryArchivedProposalsResponse message. Also converts values to other types if specified.
                 * @param message QueryArchivedProposalsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.QueryArchivedProposalsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this QueryArchivedProposalsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a GenesisState. */
            interface IGenesisState {

                /** GenesisState admins */
                admins?: (string[]|null);
            }

            /** Represents a GenesisState. */
            class GenesisState implements IGenesisState {

                /**
                 * Constructs a new GenesisState.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.adminmodule.adminmodule.IGenesisState);

                /** GenesisState admins. */
                public admins: string[];

                /**
                 * Encodes the specified GenesisState message. Does not implicitly {@link cosmos.adminmodule.adminmodule.GenesisState.verify|verify} messages.
                 * @param message GenesisState message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.adminmodule.adminmodule.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link cosmos.adminmodule.adminmodule.GenesisState.verify|verify} messages.
                 * @param message GenesisState message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.adminmodule.adminmodule.IGenesisState, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GenesisState message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GenesisState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.adminmodule.adminmodule.GenesisState;

                /**
                 * Decodes a GenesisState message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GenesisState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.adminmodule.adminmodule.GenesisState;

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
                public static fromObject(object: { [k: string]: any }): cosmos.adminmodule.adminmodule.GenesisState;

                /**
                 * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
                 * @param message GenesisState
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.adminmodule.adminmodule.GenesisState, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GenesisState to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }

    /** Namespace gov. */
    namespace gov {

        /** Namespace v1beta1. */
        namespace v1beta1 {

            /** VoteOption enum. */
            enum VoteOption {
                VOTE_OPTION_UNSPECIFIED = 0,
                VOTE_OPTION_YES = 1,
                VOTE_OPTION_ABSTAIN = 2,
                VOTE_OPTION_NO = 3,
                VOTE_OPTION_NO_WITH_VETO = 4
            }

            /** Properties of a WeightedVoteOption. */
            interface IWeightedVoteOption {

                /** WeightedVoteOption option */
                option?: (cosmos.gov.v1beta1.VoteOption|null);

                /** WeightedVoteOption weight */
                weight?: (string|null);
            }

            /** Represents a WeightedVoteOption. */
            class WeightedVoteOption implements IWeightedVoteOption {

                /**
                 * Constructs a new WeightedVoteOption.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IWeightedVoteOption);

                /** WeightedVoteOption option. */
                public option: cosmos.gov.v1beta1.VoteOption;

                /** WeightedVoteOption weight. */
                public weight: string;

                /**
                 * Encodes the specified WeightedVoteOption message. Does not implicitly {@link cosmos.gov.v1beta1.WeightedVoteOption.verify|verify} messages.
                 * @param message WeightedVoteOption message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IWeightedVoteOption, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified WeightedVoteOption message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.WeightedVoteOption.verify|verify} messages.
                 * @param message WeightedVoteOption message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IWeightedVoteOption, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a WeightedVoteOption message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns WeightedVoteOption
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.WeightedVoteOption;

                /**
                 * Decodes a WeightedVoteOption message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns WeightedVoteOption
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.WeightedVoteOption;

                /**
                 * Verifies a WeightedVoteOption message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a WeightedVoteOption message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns WeightedVoteOption
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.WeightedVoteOption;

                /**
                 * Creates a plain object from a WeightedVoteOption message. Also converts values to other types if specified.
                 * @param message WeightedVoteOption
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.WeightedVoteOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this WeightedVoteOption to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TextProposal. */
            interface ITextProposal {

                /** TextProposal title */
                title?: (string|null);

                /** TextProposal description */
                description?: (string|null);
            }

            /** Represents a TextProposal. */
            class TextProposal implements ITextProposal {

                /**
                 * Constructs a new TextProposal.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.ITextProposal);

                /** TextProposal title. */
                public title: string;

                /** TextProposal description. */
                public description: string;

                /**
                 * Encodes the specified TextProposal message. Does not implicitly {@link cosmos.gov.v1beta1.TextProposal.verify|verify} messages.
                 * @param message TextProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.ITextProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TextProposal message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.TextProposal.verify|verify} messages.
                 * @param message TextProposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.ITextProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TextProposal message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TextProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.TextProposal;

                /**
                 * Decodes a TextProposal message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TextProposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.TextProposal;

                /**
                 * Verifies a TextProposal message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TextProposal message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TextProposal
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.TextProposal;

                /**
                 * Creates a plain object from a TextProposal message. Also converts values to other types if specified.
                 * @param message TextProposal
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.TextProposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TextProposal to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Deposit. */
            interface IDeposit {

                /** Deposit proposal_id */
                proposal_id?: (Long|null);

                /** Deposit depositor */
                depositor?: (string|null);

                /** Deposit amount */
                amount?: (cosmos.base.v1beta1.ICoin[]|null);
            }

            /** Represents a Deposit. */
            class Deposit implements IDeposit {

                /**
                 * Constructs a new Deposit.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IDeposit);

                /** Deposit proposal_id. */
                public proposal_id: Long;

                /** Deposit depositor. */
                public depositor: string;

                /** Deposit amount. */
                public amount: cosmos.base.v1beta1.ICoin[];

                /**
                 * Encodes the specified Deposit message. Does not implicitly {@link cosmos.gov.v1beta1.Deposit.verify|verify} messages.
                 * @param message Deposit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IDeposit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Deposit message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.Deposit.verify|verify} messages.
                 * @param message Deposit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IDeposit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Deposit message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Deposit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.Deposit;

                /**
                 * Decodes a Deposit message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Deposit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.Deposit;

                /**
                 * Verifies a Deposit message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Deposit message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Deposit
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.Deposit;

                /**
                 * Creates a plain object from a Deposit message. Also converts values to other types if specified.
                 * @param message Deposit
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.Deposit, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Deposit to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Proposal. */
            interface IProposal {

                /** Proposal proposal_id */
                proposal_id?: (Long|null);

                /** Proposal content */
                content?: (google.protobuf.IAny|null);

                /** Proposal status */
                status?: (cosmos.gov.v1beta1.ProposalStatus|null);

                /** Proposal final_tally_result */
                final_tally_result?: (cosmos.gov.v1beta1.ITallyResult|null);

                /** Proposal submit_time */
                submit_time?: (google.protobuf.ITimestamp|null);

                /** Proposal deposit_end_time */
                deposit_end_time?: (google.protobuf.ITimestamp|null);

                /** Proposal total_deposit */
                total_deposit?: (cosmos.base.v1beta1.ICoin[]|null);

                /** Proposal voting_start_time */
                voting_start_time?: (google.protobuf.ITimestamp|null);

                /** Proposal voting_end_time */
                voting_end_time?: (google.protobuf.ITimestamp|null);
            }

            /** Represents a Proposal. */
            class Proposal implements IProposal {

                /**
                 * Constructs a new Proposal.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IProposal);

                /** Proposal proposal_id. */
                public proposal_id: Long;

                /** Proposal content. */
                public content?: (google.protobuf.IAny|null);

                /** Proposal status. */
                public status: cosmos.gov.v1beta1.ProposalStatus;

                /** Proposal final_tally_result. */
                public final_tally_result?: (cosmos.gov.v1beta1.ITallyResult|null);

                /** Proposal submit_time. */
                public submit_time?: (google.protobuf.ITimestamp|null);

                /** Proposal deposit_end_time. */
                public deposit_end_time?: (google.protobuf.ITimestamp|null);

                /** Proposal total_deposit. */
                public total_deposit: cosmos.base.v1beta1.ICoin[];

                /** Proposal voting_start_time. */
                public voting_start_time?: (google.protobuf.ITimestamp|null);

                /** Proposal voting_end_time. */
                public voting_end_time?: (google.protobuf.ITimestamp|null);

                /**
                 * Encodes the specified Proposal message. Does not implicitly {@link cosmos.gov.v1beta1.Proposal.verify|verify} messages.
                 * @param message Proposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Proposal message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.Proposal.verify|verify} messages.
                 * @param message Proposal message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IProposal, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Proposal message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Proposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.Proposal;

                /**
                 * Decodes a Proposal message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Proposal
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.Proposal;

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
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.Proposal;

                /**
                 * Creates a plain object from a Proposal message. Also converts values to other types if specified.
                 * @param message Proposal
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.Proposal, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Proposal to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** ProposalStatus enum. */
            enum ProposalStatus {
                PROPOSAL_STATUS_UNSPECIFIED = 0,
                PROPOSAL_STATUS_DEPOSIT_PERIOD = 1,
                PROPOSAL_STATUS_VOTING_PERIOD = 2,
                PROPOSAL_STATUS_PASSED = 3,
                PROPOSAL_STATUS_REJECTED = 4,
                PROPOSAL_STATUS_FAILED = 5
            }

            /** Properties of a TallyResult. */
            interface ITallyResult {

                /** TallyResult yes */
                yes?: (string|null);

                /** TallyResult abstain */
                abstain?: (string|null);

                /** TallyResult no */
                no?: (string|null);

                /** TallyResult no_with_veto */
                no_with_veto?: (string|null);
            }

            /** Represents a TallyResult. */
            class TallyResult implements ITallyResult {

                /**
                 * Constructs a new TallyResult.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.ITallyResult);

                /** TallyResult yes. */
                public yes: string;

                /** TallyResult abstain. */
                public abstain: string;

                /** TallyResult no. */
                public no: string;

                /** TallyResult no_with_veto. */
                public no_with_veto: string;

                /**
                 * Encodes the specified TallyResult message. Does not implicitly {@link cosmos.gov.v1beta1.TallyResult.verify|verify} messages.
                 * @param message TallyResult message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.ITallyResult, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TallyResult message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.TallyResult.verify|verify} messages.
                 * @param message TallyResult message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.ITallyResult, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TallyResult message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TallyResult
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.TallyResult;

                /**
                 * Decodes a TallyResult message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TallyResult
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.TallyResult;

                /**
                 * Verifies a TallyResult message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TallyResult message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TallyResult
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.TallyResult;

                /**
                 * Creates a plain object from a TallyResult message. Also converts values to other types if specified.
                 * @param message TallyResult
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.TallyResult, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TallyResult to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Vote. */
            interface IVote {

                /** Vote proposal_id */
                proposal_id?: (Long|null);

                /** Vote voter */
                voter?: (string|null);

                /** Vote option */
                option?: (cosmos.gov.v1beta1.VoteOption|null);

                /** Vote options */
                options?: (cosmos.gov.v1beta1.IWeightedVoteOption[]|null);
            }

            /** Represents a Vote. */
            class Vote implements IVote {

                /**
                 * Constructs a new Vote.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IVote);

                /** Vote proposal_id. */
                public proposal_id: Long;

                /** Vote voter. */
                public voter: string;

                /** Vote option. */
                public option: cosmos.gov.v1beta1.VoteOption;

                /** Vote options. */
                public options: cosmos.gov.v1beta1.IWeightedVoteOption[];

                /**
                 * Encodes the specified Vote message. Does not implicitly {@link cosmos.gov.v1beta1.Vote.verify|verify} messages.
                 * @param message Vote message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Vote message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.Vote.verify|verify} messages.
                 * @param message Vote message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IVote, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Vote message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Vote
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.Vote;

                /**
                 * Decodes a Vote message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Vote
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.Vote;

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
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.Vote;

                /**
                 * Creates a plain object from a Vote message. Also converts values to other types if specified.
                 * @param message Vote
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.Vote, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Vote to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a DepositParams. */
            interface IDepositParams {

                /** DepositParams min_deposit */
                min_deposit?: (cosmos.base.v1beta1.ICoin[]|null);

                /** DepositParams max_deposit_period */
                max_deposit_period?: (google.protobuf.IDuration|null);
            }

            /** Represents a DepositParams. */
            class DepositParams implements IDepositParams {

                /**
                 * Constructs a new DepositParams.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IDepositParams);

                /** DepositParams min_deposit. */
                public min_deposit: cosmos.base.v1beta1.ICoin[];

                /** DepositParams max_deposit_period. */
                public max_deposit_period?: (google.protobuf.IDuration|null);

                /**
                 * Encodes the specified DepositParams message. Does not implicitly {@link cosmos.gov.v1beta1.DepositParams.verify|verify} messages.
                 * @param message DepositParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IDepositParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DepositParams message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.DepositParams.verify|verify} messages.
                 * @param message DepositParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IDepositParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DepositParams message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DepositParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.DepositParams;

                /**
                 * Decodes a DepositParams message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DepositParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.DepositParams;

                /**
                 * Verifies a DepositParams message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DepositParams message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DepositParams
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.DepositParams;

                /**
                 * Creates a plain object from a DepositParams message. Also converts values to other types if specified.
                 * @param message DepositParams
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.DepositParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DepositParams to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a VotingParams. */
            interface IVotingParams {

                /** VotingParams voting_period */
                voting_period?: (google.protobuf.IDuration|null);
            }

            /** Represents a VotingParams. */
            class VotingParams implements IVotingParams {

                /**
                 * Constructs a new VotingParams.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.IVotingParams);

                /** VotingParams voting_period. */
                public voting_period?: (google.protobuf.IDuration|null);

                /**
                 * Encodes the specified VotingParams message. Does not implicitly {@link cosmos.gov.v1beta1.VotingParams.verify|verify} messages.
                 * @param message VotingParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.IVotingParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified VotingParams message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.VotingParams.verify|verify} messages.
                 * @param message VotingParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.IVotingParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a VotingParams message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns VotingParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.VotingParams;

                /**
                 * Decodes a VotingParams message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns VotingParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.VotingParams;

                /**
                 * Verifies a VotingParams message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a VotingParams message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns VotingParams
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.VotingParams;

                /**
                 * Creates a plain object from a VotingParams message. Also converts values to other types if specified.
                 * @param message VotingParams
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.VotingParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this VotingParams to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TallyParams. */
            interface ITallyParams {

                /** TallyParams quorum */
                quorum?: (Uint8Array|null);

                /** TallyParams threshold */
                threshold?: (Uint8Array|null);

                /** TallyParams veto_threshold */
                veto_threshold?: (Uint8Array|null);
            }

            /** Represents a TallyParams. */
            class TallyParams implements ITallyParams {

                /**
                 * Constructs a new TallyParams.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: cosmos.gov.v1beta1.ITallyParams);

                /** TallyParams quorum. */
                public quorum: Uint8Array;

                /** TallyParams threshold. */
                public threshold: Uint8Array;

                /** TallyParams veto_threshold. */
                public veto_threshold: Uint8Array;

                /**
                 * Encodes the specified TallyParams message. Does not implicitly {@link cosmos.gov.v1beta1.TallyParams.verify|verify} messages.
                 * @param message TallyParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: cosmos.gov.v1beta1.ITallyParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TallyParams message, length delimited. Does not implicitly {@link cosmos.gov.v1beta1.TallyParams.verify|verify} messages.
                 * @param message TallyParams message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: cosmos.gov.v1beta1.ITallyParams, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TallyParams message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TallyParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): cosmos.gov.v1beta1.TallyParams;

                /**
                 * Decodes a TallyParams message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TallyParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): cosmos.gov.v1beta1.TallyParams;

                /**
                 * Verifies a TallyParams message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TallyParams message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TallyParams
                 */
                public static fromObject(object: { [k: string]: any }): cosmos.gov.v1beta1.TallyParams;

                /**
                 * Creates a plain object from a TallyParams message. Also converts values to other types if specified.
                 * @param message TallyParams
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: cosmos.gov.v1beta1.TallyParams, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TallyParams to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }

    /** Namespace base. */
    namespace base {

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
