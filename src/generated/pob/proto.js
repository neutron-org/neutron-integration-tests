/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["@skip-mev/pob"] || ($protobuf.roots["@skip-mev/pob"] = {});

export const pob = $root.pob = (() => {

    /**
     * Namespace pob.
     * @exports pob
     * @namespace
     */
    const pob = {};

    pob.abci = (function() {

        /**
         * Namespace abci.
         * @memberof pob
         * @namespace
         */
        const abci = {};

        abci.v1 = (function() {

            /**
             * Namespace v1.
             * @memberof pob.abci
             * @namespace
             */
            const v1 = {};

            v1.AuctionInfo = (function() {

                /**
                 * Properties of an AuctionInfo.
                 * @memberof pob.abci.v1
                 * @interface IAuctionInfo
                 * @property {Uint8Array|null} [extended_commit_info] AuctionInfo extended_commit_info
                 * @property {Long|null} [max_tx_bytes] AuctionInfo max_tx_bytes
                 * @property {Long|null} [num_txs] AuctionInfo num_txs
                 */

                /**
                 * Constructs a new AuctionInfo.
                 * @memberof pob.abci.v1
                 * @classdesc Represents an AuctionInfo.
                 * @implements IAuctionInfo
                 * @constructor
                 * @param {pob.abci.v1.IAuctionInfo=} [properties] Properties to set
                 */
                function AuctionInfo(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * AuctionInfo extended_commit_info.
                 * @member {Uint8Array} extended_commit_info
                 * @memberof pob.abci.v1.AuctionInfo
                 * @instance
                 */
                AuctionInfo.prototype.extended_commit_info = $util.newBuffer([]);

                /**
                 * AuctionInfo max_tx_bytes.
                 * @member {Long} max_tx_bytes
                 * @memberof pob.abci.v1.AuctionInfo
                 * @instance
                 */
                AuctionInfo.prototype.max_tx_bytes = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                /**
                 * AuctionInfo num_txs.
                 * @member {Long} num_txs
                 * @memberof pob.abci.v1.AuctionInfo
                 * @instance
                 */
                AuctionInfo.prototype.num_txs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

                /**
                 * Encodes the specified AuctionInfo message. Does not implicitly {@link pob.abci.v1.AuctionInfo.verify|verify} messages.
                 * @function encode
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {pob.abci.v1.IAuctionInfo} message AuctionInfo message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                AuctionInfo.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.extended_commit_info != null && Object.hasOwnProperty.call(message, "extended_commit_info"))
                        writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.extended_commit_info);
                    if (message.max_tx_bytes != null && Object.hasOwnProperty.call(message, "max_tx_bytes"))
                        writer.uint32(/* id 2, wireType 0 =*/16).int64(message.max_tx_bytes);
                    if (message.num_txs != null && Object.hasOwnProperty.call(message, "num_txs"))
                        writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.num_txs);
                    return writer;
                };

                /**
                 * Encodes the specified AuctionInfo message, length delimited. Does not implicitly {@link pob.abci.v1.AuctionInfo.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {pob.abci.v1.IAuctionInfo} message AuctionInfo message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                AuctionInfo.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an AuctionInfo message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.abci.v1.AuctionInfo} AuctionInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                AuctionInfo.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.abci.v1.AuctionInfo();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.extended_commit_info = reader.bytes();
                            break;
                        case 2:
                            message.max_tx_bytes = reader.int64();
                            break;
                        case 3:
                            message.num_txs = reader.uint64();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes an AuctionInfo message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.abci.v1.AuctionInfo} AuctionInfo
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                AuctionInfo.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies an AuctionInfo message.
                 * @function verify
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                AuctionInfo.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.extended_commit_info != null && message.hasOwnProperty("extended_commit_info"))
                        if (!(message.extended_commit_info && typeof message.extended_commit_info.length === "number" || $util.isString(message.extended_commit_info)))
                            return "extended_commit_info: buffer expected";
                    if (message.max_tx_bytes != null && message.hasOwnProperty("max_tx_bytes"))
                        if (!$util.isInteger(message.max_tx_bytes) && !(message.max_tx_bytes && $util.isInteger(message.max_tx_bytes.low) && $util.isInteger(message.max_tx_bytes.high)))
                            return "max_tx_bytes: integer|Long expected";
                    if (message.num_txs != null && message.hasOwnProperty("num_txs"))
                        if (!$util.isInteger(message.num_txs) && !(message.num_txs && $util.isInteger(message.num_txs.low) && $util.isInteger(message.num_txs.high)))
                            return "num_txs: integer|Long expected";
                    return null;
                };

                /**
                 * Creates an AuctionInfo message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.abci.v1.AuctionInfo} AuctionInfo
                 */
                AuctionInfo.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.abci.v1.AuctionInfo)
                        return object;
                    let message = new $root.pob.abci.v1.AuctionInfo();
                    if (object.extended_commit_info != null)
                        if (typeof object.extended_commit_info === "string")
                            $util.base64.decode(object.extended_commit_info, message.extended_commit_info = $util.newBuffer($util.base64.length(object.extended_commit_info)), 0);
                        else if (object.extended_commit_info.length)
                            message.extended_commit_info = object.extended_commit_info;
                    if (object.max_tx_bytes != null)
                        if ($util.Long)
                            (message.max_tx_bytes = $util.Long.fromValue(object.max_tx_bytes)).unsigned = false;
                        else if (typeof object.max_tx_bytes === "string")
                            message.max_tx_bytes = parseInt(object.max_tx_bytes, 10);
                        else if (typeof object.max_tx_bytes === "number")
                            message.max_tx_bytes = object.max_tx_bytes;
                        else if (typeof object.max_tx_bytes === "object")
                            message.max_tx_bytes = new $util.LongBits(object.max_tx_bytes.low >>> 0, object.max_tx_bytes.high >>> 0).toNumber();
                    if (object.num_txs != null)
                        if ($util.Long)
                            (message.num_txs = $util.Long.fromValue(object.num_txs)).unsigned = true;
                        else if (typeof object.num_txs === "string")
                            message.num_txs = parseInt(object.num_txs, 10);
                        else if (typeof object.num_txs === "number")
                            message.num_txs = object.num_txs;
                        else if (typeof object.num_txs === "object")
                            message.num_txs = new $util.LongBits(object.num_txs.low >>> 0, object.num_txs.high >>> 0).toNumber(true);
                    return message;
                };

                /**
                 * Creates a plain object from an AuctionInfo message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.abci.v1.AuctionInfo
                 * @static
                 * @param {pob.abci.v1.AuctionInfo} message AuctionInfo
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                AuctionInfo.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        if (options.bytes === String)
                            object.extended_commit_info = "";
                        else {
                            object.extended_commit_info = [];
                            if (options.bytes !== Array)
                                object.extended_commit_info = $util.newBuffer(object.extended_commit_info);
                        }
                        if ($util.Long) {
                            let long = new $util.Long(0, 0, false);
                            object.max_tx_bytes = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.max_tx_bytes = options.longs === String ? "0" : 0;
                        if ($util.Long) {
                            let long = new $util.Long(0, 0, true);
                            object.num_txs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                        } else
                            object.num_txs = options.longs === String ? "0" : 0;
                    }
                    if (message.extended_commit_info != null && message.hasOwnProperty("extended_commit_info"))
                        object.extended_commit_info = options.bytes === String ? $util.base64.encode(message.extended_commit_info, 0, message.extended_commit_info.length) : options.bytes === Array ? Array.prototype.slice.call(message.extended_commit_info) : message.extended_commit_info;
                    if (message.max_tx_bytes != null && message.hasOwnProperty("max_tx_bytes"))
                        if (typeof message.max_tx_bytes === "number")
                            object.max_tx_bytes = options.longs === String ? String(message.max_tx_bytes) : message.max_tx_bytes;
                        else
                            object.max_tx_bytes = options.longs === String ? $util.Long.prototype.toString.call(message.max_tx_bytes) : options.longs === Number ? new $util.LongBits(message.max_tx_bytes.low >>> 0, message.max_tx_bytes.high >>> 0).toNumber() : message.max_tx_bytes;
                    if (message.num_txs != null && message.hasOwnProperty("num_txs"))
                        if (typeof message.num_txs === "number")
                            object.num_txs = options.longs === String ? String(message.num_txs) : message.num_txs;
                        else
                            object.num_txs = options.longs === String ? $util.Long.prototype.toString.call(message.num_txs) : options.longs === Number ? new $util.LongBits(message.num_txs.low >>> 0, message.num_txs.high >>> 0).toNumber(true) : message.num_txs;
                    return object;
                };

                /**
                 * Converts this AuctionInfo to JSON.
                 * @function toJSON
                 * @memberof pob.abci.v1.AuctionInfo
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                AuctionInfo.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return AuctionInfo;
            })();

            return v1;
        })();

        return abci;
    })();

    pob.builder = (function() {

        /**
         * Namespace builder.
         * @memberof pob
         * @namespace
         */
        const builder = {};

        builder.module = (function() {

            /**
             * Namespace module.
             * @memberof pob.builder
             * @namespace
             */
            const module = {};

            module.v1 = (function() {

                /**
                 * Namespace v1.
                 * @memberof pob.builder.module
                 * @namespace
                 */
                const v1 = {};

                v1.Module = (function() {

                    /**
                     * Properties of a Module.
                     * @memberof pob.builder.module.v1
                     * @interface IModule
                     * @property {string|null} [authority] Module authority
                     */

                    /**
                     * Constructs a new Module.
                     * @memberof pob.builder.module.v1
                     * @classdesc Represents a Module.
                     * @implements IModule
                     * @constructor
                     * @param {pob.builder.module.v1.IModule=} [properties] Properties to set
                     */
                    function Module(properties) {
                        if (properties)
                            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                if (properties[keys[i]] != null)
                                    this[keys[i]] = properties[keys[i]];
                    }

                    /**
                     * Module authority.
                     * @member {string} authority
                     * @memberof pob.builder.module.v1.Module
                     * @instance
                     */
                    Module.prototype.authority = "";

                    /**
                     * Encodes the specified Module message. Does not implicitly {@link pob.builder.module.v1.Module.verify|verify} messages.
                     * @function encode
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {pob.builder.module.v1.IModule} message Module message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Module.encode = function encode(message, writer) {
                        if (!writer)
                            writer = $Writer.create();
                        if (message.authority != null && Object.hasOwnProperty.call(message, "authority"))
                            writer.uint32(/* id 2, wireType 2 =*/18).string(message.authority);
                        return writer;
                    };

                    /**
                     * Encodes the specified Module message, length delimited. Does not implicitly {@link pob.builder.module.v1.Module.verify|verify} messages.
                     * @function encodeDelimited
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {pob.builder.module.v1.IModule} message Module message or plain object to encode
                     * @param {$protobuf.Writer} [writer] Writer to encode to
                     * @returns {$protobuf.Writer} Writer
                     */
                    Module.encodeDelimited = function encodeDelimited(message, writer) {
                        return this.encode(message, writer).ldelim();
                    };

                    /**
                     * Decodes a Module message from the specified reader or buffer.
                     * @function decode
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @param {number} [length] Message length if known beforehand
                     * @returns {pob.builder.module.v1.Module} Module
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Module.decode = function decode(reader, length) {
                        if (!(reader instanceof $Reader))
                            reader = $Reader.create(reader);
                        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.module.v1.Module();
                        while (reader.pos < end) {
                            let tag = reader.uint32();
                            switch (tag >>> 3) {
                            case 2:
                                message.authority = reader.string();
                                break;
                            default:
                                reader.skipType(tag & 7);
                                break;
                            }
                        }
                        return message;
                    };

                    /**
                     * Decodes a Module message from the specified reader or buffer, length delimited.
                     * @function decodeDelimited
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                     * @returns {pob.builder.module.v1.Module} Module
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    Module.decodeDelimited = function decodeDelimited(reader) {
                        if (!(reader instanceof $Reader))
                            reader = new $Reader(reader);
                        return this.decode(reader, reader.uint32());
                    };

                    /**
                     * Verifies a Module message.
                     * @function verify
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {Object.<string,*>} message Plain object to verify
                     * @returns {string|null} `null` if valid, otherwise the reason why it is not
                     */
                    Module.verify = function verify(message) {
                        if (typeof message !== "object" || message === null)
                            return "object expected";
                        if (message.authority != null && message.hasOwnProperty("authority"))
                            if (!$util.isString(message.authority))
                                return "authority: string expected";
                        return null;
                    };

                    /**
                     * Creates a Module message from a plain object. Also converts values to their respective internal types.
                     * @function fromObject
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {Object.<string,*>} object Plain object
                     * @returns {pob.builder.module.v1.Module} Module
                     */
                    Module.fromObject = function fromObject(object) {
                        if (object instanceof $root.pob.builder.module.v1.Module)
                            return object;
                        let message = new $root.pob.builder.module.v1.Module();
                        if (object.authority != null)
                            message.authority = String(object.authority);
                        return message;
                    };

                    /**
                     * Creates a plain object from a Module message. Also converts values to other types if specified.
                     * @function toObject
                     * @memberof pob.builder.module.v1.Module
                     * @static
                     * @param {pob.builder.module.v1.Module} message Module
                     * @param {$protobuf.IConversionOptions} [options] Conversion options
                     * @returns {Object.<string,*>} Plain object
                     */
                    Module.toObject = function toObject(message, options) {
                        if (!options)
                            options = {};
                        let object = {};
                        if (options.defaults)
                            object.authority = "";
                        if (message.authority != null && message.hasOwnProperty("authority"))
                            object.authority = message.authority;
                        return object;
                    };

                    /**
                     * Converts this Module to JSON.
                     * @function toJSON
                     * @memberof pob.builder.module.v1.Module
                     * @instance
                     * @returns {Object.<string,*>} JSON object
                     */
                    Module.prototype.toJSON = function toJSON() {
                        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                    };

                    return Module;
                })();

                return v1;
            })();

            return module;
        })();

        builder.v1 = (function() {

            /**
             * Namespace v1.
             * @memberof pob.builder
             * @namespace
             */
            const v1 = {};

            v1.GenesisState = (function() {

                /**
                 * Properties of a GenesisState.
                 * @memberof pob.builder.v1
                 * @interface IGenesisState
                 * @property {pob.builder.v1.IParams|null} [params] GenesisState params
                 */

                /**
                 * Constructs a new GenesisState.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a GenesisState.
                 * @implements IGenesisState
                 * @constructor
                 * @param {pob.builder.v1.IGenesisState=} [properties] Properties to set
                 */
                function GenesisState(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * GenesisState params.
                 * @member {pob.builder.v1.IParams|null|undefined} params
                 * @memberof pob.builder.v1.GenesisState
                 * @instance
                 */
                GenesisState.prototype.params = null;

                /**
                 * Encodes the specified GenesisState message. Does not implicitly {@link pob.builder.v1.GenesisState.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {pob.builder.v1.IGenesisState} message GenesisState message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                GenesisState.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.params != null && Object.hasOwnProperty.call(message, "params"))
                        $root.pob.builder.v1.Params.encode(message.params, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified GenesisState message, length delimited. Does not implicitly {@link pob.builder.v1.GenesisState.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {pob.builder.v1.IGenesisState} message GenesisState message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                GenesisState.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a GenesisState message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.GenesisState} GenesisState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                GenesisState.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.GenesisState();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.params = $root.pob.builder.v1.Params.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a GenesisState message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.GenesisState} GenesisState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                GenesisState.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a GenesisState message.
                 * @function verify
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                GenesisState.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.params != null && message.hasOwnProperty("params")) {
                        let error = $root.pob.builder.v1.Params.verify(message.params);
                        if (error)
                            return "params." + error;
                    }
                    return null;
                };

                /**
                 * Creates a GenesisState message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.GenesisState} GenesisState
                 */
                GenesisState.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.GenesisState)
                        return object;
                    let message = new $root.pob.builder.v1.GenesisState();
                    if (object.params != null) {
                        if (typeof object.params !== "object")
                            throw TypeError(".pob.builder.v1.GenesisState.params: object expected");
                        message.params = $root.pob.builder.v1.Params.fromObject(object.params);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a GenesisState message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.GenesisState
                 * @static
                 * @param {pob.builder.v1.GenesisState} message GenesisState
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                GenesisState.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults)
                        object.params = null;
                    if (message.params != null && message.hasOwnProperty("params"))
                        object.params = $root.pob.builder.v1.Params.toObject(message.params, options);
                    return object;
                };

                /**
                 * Converts this GenesisState to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.GenesisState
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                GenesisState.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return GenesisState;
            })();

            v1.Params = (function() {

                /**
                 * Properties of a Params.
                 * @memberof pob.builder.v1
                 * @interface IParams
                 * @property {number|null} [max_bundle_size] Params max_bundle_size
                 * @property {Uint8Array|null} [escrow_account_address] Params escrow_account_address
                 * @property {cosmos.base.v1beta1.ICoin|null} [reserve_fee] Params reserve_fee
                 * @property {cosmos.base.v1beta1.ICoin|null} [min_bid_increment] Params min_bid_increment
                 * @property {boolean|null} [front_running_protection] Params front_running_protection
                 * @property {string|null} [proposer_fee] Params proposer_fee
                 */

                /**
                 * Constructs a new Params.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a Params.
                 * @implements IParams
                 * @constructor
                 * @param {pob.builder.v1.IParams=} [properties] Properties to set
                 */
                function Params(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Params max_bundle_size.
                 * @member {number} max_bundle_size
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.max_bundle_size = 0;

                /**
                 * Params escrow_account_address.
                 * @member {Uint8Array} escrow_account_address
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.escrow_account_address = $util.newBuffer([]);

                /**
                 * Params reserve_fee.
                 * @member {cosmos.base.v1beta1.ICoin|null|undefined} reserve_fee
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.reserve_fee = null;

                /**
                 * Params min_bid_increment.
                 * @member {cosmos.base.v1beta1.ICoin|null|undefined} min_bid_increment
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.min_bid_increment = null;

                /**
                 * Params front_running_protection.
                 * @member {boolean} front_running_protection
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.front_running_protection = false;

                /**
                 * Params proposer_fee.
                 * @member {string} proposer_fee
                 * @memberof pob.builder.v1.Params
                 * @instance
                 */
                Params.prototype.proposer_fee = "";

                /**
                 * Encodes the specified Params message. Does not implicitly {@link pob.builder.v1.Params.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {pob.builder.v1.IParams} message Params message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Params.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.max_bundle_size != null && Object.hasOwnProperty.call(message, "max_bundle_size"))
                        writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.max_bundle_size);
                    if (message.escrow_account_address != null && Object.hasOwnProperty.call(message, "escrow_account_address"))
                        writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.escrow_account_address);
                    if (message.reserve_fee != null && Object.hasOwnProperty.call(message, "reserve_fee"))
                        $root.cosmos.base.v1beta1.Coin.encode(message.reserve_fee, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                    if (message.min_bid_increment != null && Object.hasOwnProperty.call(message, "min_bid_increment"))
                        $root.cosmos.base.v1beta1.Coin.encode(message.min_bid_increment, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                    if (message.front_running_protection != null && Object.hasOwnProperty.call(message, "front_running_protection"))
                        writer.uint32(/* id 5, wireType 0 =*/40).bool(message.front_running_protection);
                    if (message.proposer_fee != null && Object.hasOwnProperty.call(message, "proposer_fee"))
                        writer.uint32(/* id 6, wireType 2 =*/50).string(message.proposer_fee);
                    return writer;
                };

                /**
                 * Encodes the specified Params message, length delimited. Does not implicitly {@link pob.builder.v1.Params.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {pob.builder.v1.IParams} message Params message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Params.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Params message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.Params} Params
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Params.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.Params();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.max_bundle_size = reader.uint32();
                            break;
                        case 2:
                            message.escrow_account_address = reader.bytes();
                            break;
                        case 3:
                            message.reserve_fee = $root.cosmos.base.v1beta1.Coin.decode(reader, reader.uint32());
                            break;
                        case 4:
                            message.min_bid_increment = $root.cosmos.base.v1beta1.Coin.decode(reader, reader.uint32());
                            break;
                        case 5:
                            message.front_running_protection = reader.bool();
                            break;
                        case 6:
                            message.proposer_fee = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Params message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.Params} Params
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Params.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Params message.
                 * @function verify
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Params.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.max_bundle_size != null && message.hasOwnProperty("max_bundle_size"))
                        if (!$util.isInteger(message.max_bundle_size))
                            return "max_bundle_size: integer expected";
                    if (message.escrow_account_address != null && message.hasOwnProperty("escrow_account_address"))
                        if (!(message.escrow_account_address && typeof message.escrow_account_address.length === "number" || $util.isString(message.escrow_account_address)))
                            return "escrow_account_address: buffer expected";
                    if (message.reserve_fee != null && message.hasOwnProperty("reserve_fee")) {
                        let error = $root.cosmos.base.v1beta1.Coin.verify(message.reserve_fee);
                        if (error)
                            return "reserve_fee." + error;
                    }
                    if (message.min_bid_increment != null && message.hasOwnProperty("min_bid_increment")) {
                        let error = $root.cosmos.base.v1beta1.Coin.verify(message.min_bid_increment);
                        if (error)
                            return "min_bid_increment." + error;
                    }
                    if (message.front_running_protection != null && message.hasOwnProperty("front_running_protection"))
                        if (typeof message.front_running_protection !== "boolean")
                            return "front_running_protection: boolean expected";
                    if (message.proposer_fee != null && message.hasOwnProperty("proposer_fee"))
                        if (!$util.isString(message.proposer_fee))
                            return "proposer_fee: string expected";
                    return null;
                };

                /**
                 * Creates a Params message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.Params} Params
                 */
                Params.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.Params)
                        return object;
                    let message = new $root.pob.builder.v1.Params();
                    if (object.max_bundle_size != null)
                        message.max_bundle_size = object.max_bundle_size >>> 0;
                    if (object.escrow_account_address != null)
                        if (typeof object.escrow_account_address === "string")
                            $util.base64.decode(object.escrow_account_address, message.escrow_account_address = $util.newBuffer($util.base64.length(object.escrow_account_address)), 0);
                        else if (object.escrow_account_address.length)
                            message.escrow_account_address = object.escrow_account_address;
                    if (object.reserve_fee != null) {
                        if (typeof object.reserve_fee !== "object")
                            throw TypeError(".pob.builder.v1.Params.reserve_fee: object expected");
                        message.reserve_fee = $root.cosmos.base.v1beta1.Coin.fromObject(object.reserve_fee);
                    }
                    if (object.min_bid_increment != null) {
                        if (typeof object.min_bid_increment !== "object")
                            throw TypeError(".pob.builder.v1.Params.min_bid_increment: object expected");
                        message.min_bid_increment = $root.cosmos.base.v1beta1.Coin.fromObject(object.min_bid_increment);
                    }
                    if (object.front_running_protection != null)
                        message.front_running_protection = Boolean(object.front_running_protection);
                    if (object.proposer_fee != null)
                        message.proposer_fee = String(object.proposer_fee);
                    return message;
                };

                /**
                 * Creates a plain object from a Params message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.Params
                 * @static
                 * @param {pob.builder.v1.Params} message Params
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Params.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.max_bundle_size = 0;
                        if (options.bytes === String)
                            object.escrow_account_address = "";
                        else {
                            object.escrow_account_address = [];
                            if (options.bytes !== Array)
                                object.escrow_account_address = $util.newBuffer(object.escrow_account_address);
                        }
                        object.reserve_fee = null;
                        object.min_bid_increment = null;
                        object.front_running_protection = false;
                        object.proposer_fee = "";
                    }
                    if (message.max_bundle_size != null && message.hasOwnProperty("max_bundle_size"))
                        object.max_bundle_size = message.max_bundle_size;
                    if (message.escrow_account_address != null && message.hasOwnProperty("escrow_account_address"))
                        object.escrow_account_address = options.bytes === String ? $util.base64.encode(message.escrow_account_address, 0, message.escrow_account_address.length) : options.bytes === Array ? Array.prototype.slice.call(message.escrow_account_address) : message.escrow_account_address;
                    if (message.reserve_fee != null && message.hasOwnProperty("reserve_fee"))
                        object.reserve_fee = $root.cosmos.base.v1beta1.Coin.toObject(message.reserve_fee, options);
                    if (message.min_bid_increment != null && message.hasOwnProperty("min_bid_increment"))
                        object.min_bid_increment = $root.cosmos.base.v1beta1.Coin.toObject(message.min_bid_increment, options);
                    if (message.front_running_protection != null && message.hasOwnProperty("front_running_protection"))
                        object.front_running_protection = message.front_running_protection;
                    if (message.proposer_fee != null && message.hasOwnProperty("proposer_fee"))
                        object.proposer_fee = message.proposer_fee;
                    return object;
                };

                /**
                 * Converts this Params to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.Params
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Params.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Params;
            })();

            v1.Query = (function() {

                /**
                 * Constructs a new Query service.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a Query
                 * @extends $protobuf.rpc.Service
                 * @constructor
                 * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                 */
                function Query(rpcImpl, requestDelimited, responseDelimited) {
                    $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                }

                (Query.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Query;

                /**
                 * Callback as used by {@link pob.builder.v1.Query#params}.
                 * @memberof pob.builder.v1.Query
                 * @typedef ParamsCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {pob.builder.v1.QueryParamsResponse} [response] QueryParamsResponse
                 */

                /**
                 * Calls Params.
                 * @function params
                 * @memberof pob.builder.v1.Query
                 * @instance
                 * @param {pob.builder.v1.IQueryParamsRequest} request QueryParamsRequest message or plain object
                 * @param {pob.builder.v1.Query.ParamsCallback} callback Node-style callback called with the error, if any, and QueryParamsResponse
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Query.prototype.params = function params(request, callback) {
                    return this.rpcCall(params, $root.pob.builder.v1.QueryParamsRequest, $root.pob.builder.v1.QueryParamsResponse, request, callback);
                }, "name", { value: "Params" });

                /**
                 * Calls Params.
                 * @function params
                 * @memberof pob.builder.v1.Query
                 * @instance
                 * @param {pob.builder.v1.IQueryParamsRequest} request QueryParamsRequest message or plain object
                 * @returns {Promise<pob.builder.v1.QueryParamsResponse>} Promise
                 * @variation 2
                 */

                return Query;
            })();

            v1.QueryParamsRequest = (function() {

                /**
                 * Properties of a QueryParamsRequest.
                 * @memberof pob.builder.v1
                 * @interface IQueryParamsRequest
                 */

                /**
                 * Constructs a new QueryParamsRequest.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a QueryParamsRequest.
                 * @implements IQueryParamsRequest
                 * @constructor
                 * @param {pob.builder.v1.IQueryParamsRequest=} [properties] Properties to set
                 */
                function QueryParamsRequest(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Encodes the specified QueryParamsRequest message. Does not implicitly {@link pob.builder.v1.QueryParamsRequest.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {pob.builder.v1.IQueryParamsRequest} message QueryParamsRequest message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                QueryParamsRequest.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    return writer;
                };

                /**
                 * Encodes the specified QueryParamsRequest message, length delimited. Does not implicitly {@link pob.builder.v1.QueryParamsRequest.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {pob.builder.v1.IQueryParamsRequest} message QueryParamsRequest message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                QueryParamsRequest.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a QueryParamsRequest message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.QueryParamsRequest} QueryParamsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                QueryParamsRequest.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.QueryParamsRequest();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a QueryParamsRequest message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.QueryParamsRequest} QueryParamsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                QueryParamsRequest.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a QueryParamsRequest message.
                 * @function verify
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                QueryParamsRequest.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    return null;
                };

                /**
                 * Creates a QueryParamsRequest message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.QueryParamsRequest} QueryParamsRequest
                 */
                QueryParamsRequest.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.QueryParamsRequest)
                        return object;
                    return new $root.pob.builder.v1.QueryParamsRequest();
                };

                /**
                 * Creates a plain object from a QueryParamsRequest message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @static
                 * @param {pob.builder.v1.QueryParamsRequest} message QueryParamsRequest
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                QueryParamsRequest.toObject = function toObject() {
                    return {};
                };

                /**
                 * Converts this QueryParamsRequest to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.QueryParamsRequest
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                QueryParamsRequest.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return QueryParamsRequest;
            })();

            v1.QueryParamsResponse = (function() {

                /**
                 * Properties of a QueryParamsResponse.
                 * @memberof pob.builder.v1
                 * @interface IQueryParamsResponse
                 * @property {pob.builder.v1.IParams|null} [params] QueryParamsResponse params
                 */

                /**
                 * Constructs a new QueryParamsResponse.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a QueryParamsResponse.
                 * @implements IQueryParamsResponse
                 * @constructor
                 * @param {pob.builder.v1.IQueryParamsResponse=} [properties] Properties to set
                 */
                function QueryParamsResponse(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * QueryParamsResponse params.
                 * @member {pob.builder.v1.IParams|null|undefined} params
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @instance
                 */
                QueryParamsResponse.prototype.params = null;

                /**
                 * Encodes the specified QueryParamsResponse message. Does not implicitly {@link pob.builder.v1.QueryParamsResponse.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {pob.builder.v1.IQueryParamsResponse} message QueryParamsResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                QueryParamsResponse.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.params != null && Object.hasOwnProperty.call(message, "params"))
                        $root.pob.builder.v1.Params.encode(message.params, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified QueryParamsResponse message, length delimited. Does not implicitly {@link pob.builder.v1.QueryParamsResponse.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {pob.builder.v1.IQueryParamsResponse} message QueryParamsResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                QueryParamsResponse.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a QueryParamsResponse message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.QueryParamsResponse} QueryParamsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                QueryParamsResponse.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.QueryParamsResponse();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.params = $root.pob.builder.v1.Params.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a QueryParamsResponse message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.QueryParamsResponse} QueryParamsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                QueryParamsResponse.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a QueryParamsResponse message.
                 * @function verify
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                QueryParamsResponse.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.params != null && message.hasOwnProperty("params")) {
                        let error = $root.pob.builder.v1.Params.verify(message.params);
                        if (error)
                            return "params." + error;
                    }
                    return null;
                };

                /**
                 * Creates a QueryParamsResponse message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.QueryParamsResponse} QueryParamsResponse
                 */
                QueryParamsResponse.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.QueryParamsResponse)
                        return object;
                    let message = new $root.pob.builder.v1.QueryParamsResponse();
                    if (object.params != null) {
                        if (typeof object.params !== "object")
                            throw TypeError(".pob.builder.v1.QueryParamsResponse.params: object expected");
                        message.params = $root.pob.builder.v1.Params.fromObject(object.params);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a QueryParamsResponse message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @static
                 * @param {pob.builder.v1.QueryParamsResponse} message QueryParamsResponse
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                QueryParamsResponse.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults)
                        object.params = null;
                    if (message.params != null && message.hasOwnProperty("params"))
                        object.params = $root.pob.builder.v1.Params.toObject(message.params, options);
                    return object;
                };

                /**
                 * Converts this QueryParamsResponse to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.QueryParamsResponse
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                QueryParamsResponse.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return QueryParamsResponse;
            })();

            v1.Msg = (function() {

                /**
                 * Constructs a new Msg service.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a Msg
                 * @extends $protobuf.rpc.Service
                 * @constructor
                 * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                 */
                function Msg(rpcImpl, requestDelimited, responseDelimited) {
                    $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                }

                (Msg.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = Msg;

                /**
                 * Callback as used by {@link pob.builder.v1.Msg#auctionBid}.
                 * @memberof pob.builder.v1.Msg
                 * @typedef AuctionBidCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {pob.builder.v1.MsgAuctionBidResponse} [response] MsgAuctionBidResponse
                 */

                /**
                 * Calls AuctionBid.
                 * @function auctionBid
                 * @memberof pob.builder.v1.Msg
                 * @instance
                 * @param {pob.builder.v1.IMsgAuctionBid} request MsgAuctionBid message or plain object
                 * @param {pob.builder.v1.Msg.AuctionBidCallback} callback Node-style callback called with the error, if any, and MsgAuctionBidResponse
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Msg.prototype.auctionBid = function auctionBid(request, callback) {
                    return this.rpcCall(auctionBid, $root.pob.builder.v1.MsgAuctionBid, $root.pob.builder.v1.MsgAuctionBidResponse, request, callback);
                }, "name", { value: "AuctionBid" });

                /**
                 * Calls AuctionBid.
                 * @function auctionBid
                 * @memberof pob.builder.v1.Msg
                 * @instance
                 * @param {pob.builder.v1.IMsgAuctionBid} request MsgAuctionBid message or plain object
                 * @returns {Promise<pob.builder.v1.MsgAuctionBidResponse>} Promise
                 * @variation 2
                 */

                /**
                 * Callback as used by {@link pob.builder.v1.Msg#updateParams}.
                 * @memberof pob.builder.v1.Msg
                 * @typedef UpdateParamsCallback
                 * @type {function}
                 * @param {Error|null} error Error, if any
                 * @param {pob.builder.v1.MsgUpdateParamsResponse} [response] MsgUpdateParamsResponse
                 */

                /**
                 * Calls UpdateParams.
                 * @function updateParams
                 * @memberof pob.builder.v1.Msg
                 * @instance
                 * @param {pob.builder.v1.IMsgUpdateParams} request MsgUpdateParams message or plain object
                 * @param {pob.builder.v1.Msg.UpdateParamsCallback} callback Node-style callback called with the error, if any, and MsgUpdateParamsResponse
                 * @returns {undefined}
                 * @variation 1
                 */
                Object.defineProperty(Msg.prototype.updateParams = function updateParams(request, callback) {
                    return this.rpcCall(updateParams, $root.pob.builder.v1.MsgUpdateParams, $root.pob.builder.v1.MsgUpdateParamsResponse, request, callback);
                }, "name", { value: "UpdateParams" });

                /**
                 * Calls UpdateParams.
                 * @function updateParams
                 * @memberof pob.builder.v1.Msg
                 * @instance
                 * @param {pob.builder.v1.IMsgUpdateParams} request MsgUpdateParams message or plain object
                 * @returns {Promise<pob.builder.v1.MsgUpdateParamsResponse>} Promise
                 * @variation 2
                 */

                return Msg;
            })();

            v1.MsgAuctionBid = (function() {

                /**
                 * Properties of a MsgAuctionBid.
                 * @memberof pob.builder.v1
                 * @interface IMsgAuctionBid
                 * @property {string|null} [bidder] MsgAuctionBid bidder
                 * @property {cosmos.base.v1beta1.ICoin|null} [bid] MsgAuctionBid bid
                 * @property {Array.<Uint8Array>|null} [transactions] MsgAuctionBid transactions
                 */

                /**
                 * Constructs a new MsgAuctionBid.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a MsgAuctionBid.
                 * @implements IMsgAuctionBid
                 * @constructor
                 * @param {pob.builder.v1.IMsgAuctionBid=} [properties] Properties to set
                 */
                function MsgAuctionBid(properties) {
                    this.transactions = [];
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * MsgAuctionBid bidder.
                 * @member {string} bidder
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @instance
                 */
                MsgAuctionBid.prototype.bidder = "";

                /**
                 * MsgAuctionBid bid.
                 * @member {cosmos.base.v1beta1.ICoin|null|undefined} bid
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @instance
                 */
                MsgAuctionBid.prototype.bid = null;

                /**
                 * MsgAuctionBid transactions.
                 * @member {Array.<Uint8Array>} transactions
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @instance
                 */
                MsgAuctionBid.prototype.transactions = $util.emptyArray;

                /**
                 * Encodes the specified MsgAuctionBid message. Does not implicitly {@link pob.builder.v1.MsgAuctionBid.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {pob.builder.v1.IMsgAuctionBid} message MsgAuctionBid message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgAuctionBid.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.bidder != null && Object.hasOwnProperty.call(message, "bidder"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.bidder);
                    if (message.bid != null && Object.hasOwnProperty.call(message, "bid"))
                        $root.cosmos.base.v1beta1.Coin.encode(message.bid, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    if (message.transactions != null && message.transactions.length)
                        for (let i = 0; i < message.transactions.length; ++i)
                            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.transactions[i]);
                    return writer;
                };

                /**
                 * Encodes the specified MsgAuctionBid message, length delimited. Does not implicitly {@link pob.builder.v1.MsgAuctionBid.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {pob.builder.v1.IMsgAuctionBid} message MsgAuctionBid message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgAuctionBid.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a MsgAuctionBid message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.MsgAuctionBid} MsgAuctionBid
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgAuctionBid.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.MsgAuctionBid();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.bidder = reader.string();
                            break;
                        case 2:
                            message.bid = $root.cosmos.base.v1beta1.Coin.decode(reader, reader.uint32());
                            break;
                        case 3:
                            if (!(message.transactions && message.transactions.length))
                                message.transactions = [];
                            message.transactions.push(reader.bytes());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a MsgAuctionBid message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.MsgAuctionBid} MsgAuctionBid
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgAuctionBid.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a MsgAuctionBid message.
                 * @function verify
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                MsgAuctionBid.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.bidder != null && message.hasOwnProperty("bidder"))
                        if (!$util.isString(message.bidder))
                            return "bidder: string expected";
                    if (message.bid != null && message.hasOwnProperty("bid")) {
                        let error = $root.cosmos.base.v1beta1.Coin.verify(message.bid);
                        if (error)
                            return "bid." + error;
                    }
                    if (message.transactions != null && message.hasOwnProperty("transactions")) {
                        if (!Array.isArray(message.transactions))
                            return "transactions: array expected";
                        for (let i = 0; i < message.transactions.length; ++i)
                            if (!(message.transactions[i] && typeof message.transactions[i].length === "number" || $util.isString(message.transactions[i])))
                                return "transactions: buffer[] expected";
                    }
                    return null;
                };

                /**
                 * Creates a MsgAuctionBid message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.MsgAuctionBid} MsgAuctionBid
                 */
                MsgAuctionBid.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.MsgAuctionBid)
                        return object;
                    let message = new $root.pob.builder.v1.MsgAuctionBid();
                    if (object.bidder != null)
                        message.bidder = String(object.bidder);
                    if (object.bid != null) {
                        if (typeof object.bid !== "object")
                            throw TypeError(".pob.builder.v1.MsgAuctionBid.bid: object expected");
                        message.bid = $root.cosmos.base.v1beta1.Coin.fromObject(object.bid);
                    }
                    if (object.transactions) {
                        if (!Array.isArray(object.transactions))
                            throw TypeError(".pob.builder.v1.MsgAuctionBid.transactions: array expected");
                        message.transactions = [];
                        for (let i = 0; i < object.transactions.length; ++i)
                            if (typeof object.transactions[i] === "string")
                                $util.base64.decode(object.transactions[i], message.transactions[i] = $util.newBuffer($util.base64.length(object.transactions[i])), 0);
                            else if (object.transactions[i].length)
                                message.transactions[i] = object.transactions[i];
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a MsgAuctionBid message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @static
                 * @param {pob.builder.v1.MsgAuctionBid} message MsgAuctionBid
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MsgAuctionBid.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.arrays || options.defaults)
                        object.transactions = [];
                    if (options.defaults) {
                        object.bidder = "";
                        object.bid = null;
                    }
                    if (message.bidder != null && message.hasOwnProperty("bidder"))
                        object.bidder = message.bidder;
                    if (message.bid != null && message.hasOwnProperty("bid"))
                        object.bid = $root.cosmos.base.v1beta1.Coin.toObject(message.bid, options);
                    if (message.transactions && message.transactions.length) {
                        object.transactions = [];
                        for (let j = 0; j < message.transactions.length; ++j)
                            object.transactions[j] = options.bytes === String ? $util.base64.encode(message.transactions[j], 0, message.transactions[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.transactions[j]) : message.transactions[j];
                    }
                    return object;
                };

                /**
                 * Converts this MsgAuctionBid to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.MsgAuctionBid
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MsgAuctionBid.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return MsgAuctionBid;
            })();

            v1.MsgAuctionBidResponse = (function() {

                /**
                 * Properties of a MsgAuctionBidResponse.
                 * @memberof pob.builder.v1
                 * @interface IMsgAuctionBidResponse
                 */

                /**
                 * Constructs a new MsgAuctionBidResponse.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a MsgAuctionBidResponse.
                 * @implements IMsgAuctionBidResponse
                 * @constructor
                 * @param {pob.builder.v1.IMsgAuctionBidResponse=} [properties] Properties to set
                 */
                function MsgAuctionBidResponse(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Encodes the specified MsgAuctionBidResponse message. Does not implicitly {@link pob.builder.v1.MsgAuctionBidResponse.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {pob.builder.v1.IMsgAuctionBidResponse} message MsgAuctionBidResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgAuctionBidResponse.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    return writer;
                };

                /**
                 * Encodes the specified MsgAuctionBidResponse message, length delimited. Does not implicitly {@link pob.builder.v1.MsgAuctionBidResponse.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {pob.builder.v1.IMsgAuctionBidResponse} message MsgAuctionBidResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgAuctionBidResponse.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a MsgAuctionBidResponse message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.MsgAuctionBidResponse} MsgAuctionBidResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgAuctionBidResponse.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.MsgAuctionBidResponse();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a MsgAuctionBidResponse message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.MsgAuctionBidResponse} MsgAuctionBidResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgAuctionBidResponse.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a MsgAuctionBidResponse message.
                 * @function verify
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                MsgAuctionBidResponse.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    return null;
                };

                /**
                 * Creates a MsgAuctionBidResponse message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.MsgAuctionBidResponse} MsgAuctionBidResponse
                 */
                MsgAuctionBidResponse.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.MsgAuctionBidResponse)
                        return object;
                    return new $root.pob.builder.v1.MsgAuctionBidResponse();
                };

                /**
                 * Creates a plain object from a MsgAuctionBidResponse message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @static
                 * @param {pob.builder.v1.MsgAuctionBidResponse} message MsgAuctionBidResponse
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MsgAuctionBidResponse.toObject = function toObject() {
                    return {};
                };

                /**
                 * Converts this MsgAuctionBidResponse to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.MsgAuctionBidResponse
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MsgAuctionBidResponse.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return MsgAuctionBidResponse;
            })();

            v1.MsgUpdateParams = (function() {

                /**
                 * Properties of a MsgUpdateParams.
                 * @memberof pob.builder.v1
                 * @interface IMsgUpdateParams
                 * @property {string|null} [authority] MsgUpdateParams authority
                 * @property {pob.builder.v1.IParams|null} [params] MsgUpdateParams params
                 */

                /**
                 * Constructs a new MsgUpdateParams.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a MsgUpdateParams.
                 * @implements IMsgUpdateParams
                 * @constructor
                 * @param {pob.builder.v1.IMsgUpdateParams=} [properties] Properties to set
                 */
                function MsgUpdateParams(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * MsgUpdateParams authority.
                 * @member {string} authority
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @instance
                 */
                MsgUpdateParams.prototype.authority = "";

                /**
                 * MsgUpdateParams params.
                 * @member {pob.builder.v1.IParams|null|undefined} params
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @instance
                 */
                MsgUpdateParams.prototype.params = null;

                /**
                 * Encodes the specified MsgUpdateParams message. Does not implicitly {@link pob.builder.v1.MsgUpdateParams.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {pob.builder.v1.IMsgUpdateParams} message MsgUpdateParams message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgUpdateParams.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.authority != null && Object.hasOwnProperty.call(message, "authority"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.authority);
                    if (message.params != null && Object.hasOwnProperty.call(message, "params"))
                        $root.pob.builder.v1.Params.encode(message.params, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                    return writer;
                };

                /**
                 * Encodes the specified MsgUpdateParams message, length delimited. Does not implicitly {@link pob.builder.v1.MsgUpdateParams.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {pob.builder.v1.IMsgUpdateParams} message MsgUpdateParams message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgUpdateParams.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a MsgUpdateParams message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.MsgUpdateParams} MsgUpdateParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgUpdateParams.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.MsgUpdateParams();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.authority = reader.string();
                            break;
                        case 2:
                            message.params = $root.pob.builder.v1.Params.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a MsgUpdateParams message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.MsgUpdateParams} MsgUpdateParams
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgUpdateParams.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a MsgUpdateParams message.
                 * @function verify
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                MsgUpdateParams.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.authority != null && message.hasOwnProperty("authority"))
                        if (!$util.isString(message.authority))
                            return "authority: string expected";
                    if (message.params != null && message.hasOwnProperty("params")) {
                        let error = $root.pob.builder.v1.Params.verify(message.params);
                        if (error)
                            return "params." + error;
                    }
                    return null;
                };

                /**
                 * Creates a MsgUpdateParams message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.MsgUpdateParams} MsgUpdateParams
                 */
                MsgUpdateParams.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.MsgUpdateParams)
                        return object;
                    let message = new $root.pob.builder.v1.MsgUpdateParams();
                    if (object.authority != null)
                        message.authority = String(object.authority);
                    if (object.params != null) {
                        if (typeof object.params !== "object")
                            throw TypeError(".pob.builder.v1.MsgUpdateParams.params: object expected");
                        message.params = $root.pob.builder.v1.Params.fromObject(object.params);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a MsgUpdateParams message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @static
                 * @param {pob.builder.v1.MsgUpdateParams} message MsgUpdateParams
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MsgUpdateParams.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.authority = "";
                        object.params = null;
                    }
                    if (message.authority != null && message.hasOwnProperty("authority"))
                        object.authority = message.authority;
                    if (message.params != null && message.hasOwnProperty("params"))
                        object.params = $root.pob.builder.v1.Params.toObject(message.params, options);
                    return object;
                };

                /**
                 * Converts this MsgUpdateParams to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.MsgUpdateParams
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MsgUpdateParams.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return MsgUpdateParams;
            })();

            v1.MsgUpdateParamsResponse = (function() {

                /**
                 * Properties of a MsgUpdateParamsResponse.
                 * @memberof pob.builder.v1
                 * @interface IMsgUpdateParamsResponse
                 */

                /**
                 * Constructs a new MsgUpdateParamsResponse.
                 * @memberof pob.builder.v1
                 * @classdesc Represents a MsgUpdateParamsResponse.
                 * @implements IMsgUpdateParamsResponse
                 * @constructor
                 * @param {pob.builder.v1.IMsgUpdateParamsResponse=} [properties] Properties to set
                 */
                function MsgUpdateParamsResponse(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Encodes the specified MsgUpdateParamsResponse message. Does not implicitly {@link pob.builder.v1.MsgUpdateParamsResponse.verify|verify} messages.
                 * @function encode
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {pob.builder.v1.IMsgUpdateParamsResponse} message MsgUpdateParamsResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgUpdateParamsResponse.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    return writer;
                };

                /**
                 * Encodes the specified MsgUpdateParamsResponse message, length delimited. Does not implicitly {@link pob.builder.v1.MsgUpdateParamsResponse.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {pob.builder.v1.IMsgUpdateParamsResponse} message MsgUpdateParamsResponse message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                MsgUpdateParamsResponse.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a MsgUpdateParamsResponse message from the specified reader or buffer.
                 * @function decode
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {pob.builder.v1.MsgUpdateParamsResponse} MsgUpdateParamsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgUpdateParamsResponse.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.pob.builder.v1.MsgUpdateParamsResponse();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a MsgUpdateParamsResponse message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {pob.builder.v1.MsgUpdateParamsResponse} MsgUpdateParamsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                MsgUpdateParamsResponse.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a MsgUpdateParamsResponse message.
                 * @function verify
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                MsgUpdateParamsResponse.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    return null;
                };

                /**
                 * Creates a MsgUpdateParamsResponse message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {pob.builder.v1.MsgUpdateParamsResponse} MsgUpdateParamsResponse
                 */
                MsgUpdateParamsResponse.fromObject = function fromObject(object) {
                    if (object instanceof $root.pob.builder.v1.MsgUpdateParamsResponse)
                        return object;
                    return new $root.pob.builder.v1.MsgUpdateParamsResponse();
                };

                /**
                 * Creates a plain object from a MsgUpdateParamsResponse message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @static
                 * @param {pob.builder.v1.MsgUpdateParamsResponse} message MsgUpdateParamsResponse
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                MsgUpdateParamsResponse.toObject = function toObject() {
                    return {};
                };

                /**
                 * Converts this MsgUpdateParamsResponse to JSON.
                 * @function toJSON
                 * @memberof pob.builder.v1.MsgUpdateParamsResponse
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                MsgUpdateParamsResponse.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return MsgUpdateParamsResponse;
            })();

            return v1;
        })();

        return builder;
    })();

    return pob;
})();

export const gogoproto = $root.gogoproto = (() => {

    /**
     * Namespace gogoproto.
     * @exports gogoproto
     * @namespace
     */
    const gogoproto = {};

    return gogoproto;
})();

export const google = $root.google = (() => {

    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    const google = {};

    google.protobuf = (function() {

        /**
         * Namespace protobuf.
         * @memberof google
         * @namespace
         */
        const protobuf = {};

        protobuf.FileDescriptorSet = (function() {

            /**
             * Properties of a FileDescriptorSet.
             * @memberof google.protobuf
             * @interface IFileDescriptorSet
             * @property {Array.<google.protobuf.IFileDescriptorProto>|null} [file] FileDescriptorSet file
             */

            /**
             * Constructs a new FileDescriptorSet.
             * @memberof google.protobuf
             * @classdesc Represents a FileDescriptorSet.
             * @implements IFileDescriptorSet
             * @constructor
             * @param {google.protobuf.IFileDescriptorSet=} [properties] Properties to set
             */
            function FileDescriptorSet(properties) {
                this.file = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FileDescriptorSet file.
             * @member {Array.<google.protobuf.IFileDescriptorProto>} file
             * @memberof google.protobuf.FileDescriptorSet
             * @instance
             */
            FileDescriptorSet.prototype.file = $util.emptyArray;

            /**
             * Encodes the specified FileDescriptorSet message. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {google.protobuf.IFileDescriptorSet} message FileDescriptorSet message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorSet.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.file != null && message.file.length)
                    for (let i = 0; i < message.file.length; ++i)
                        $root.google.protobuf.FileDescriptorProto.encode(message.file[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified FileDescriptorSet message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {google.protobuf.IFileDescriptorSet} message FileDescriptorSet message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorSet.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.FileDescriptorSet} FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorSet.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.FileDescriptorSet();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.file && message.file.length))
                            message.file = [];
                        message.file.push($root.google.protobuf.FileDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.FileDescriptorSet} FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorSet.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FileDescriptorSet message.
             * @function verify
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FileDescriptorSet.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.file != null && message.hasOwnProperty("file")) {
                    if (!Array.isArray(message.file))
                        return "file: array expected";
                    for (let i = 0; i < message.file.length; ++i) {
                        let error = $root.google.protobuf.FileDescriptorProto.verify(message.file[i]);
                        if (error)
                            return "file." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.FileDescriptorSet} FileDescriptorSet
             */
            FileDescriptorSet.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.FileDescriptorSet)
                    return object;
                let message = new $root.google.protobuf.FileDescriptorSet();
                if (object.file) {
                    if (!Array.isArray(object.file))
                        throw TypeError(".google.protobuf.FileDescriptorSet.file: array expected");
                    message.file = [];
                    for (let i = 0; i < object.file.length; ++i) {
                        if (typeof object.file[i] !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorSet.file: object expected");
                        message.file[i] = $root.google.protobuf.FileDescriptorProto.fromObject(object.file[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.FileDescriptorSet
             * @static
             * @param {google.protobuf.FileDescriptorSet} message FileDescriptorSet
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FileDescriptorSet.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.file = [];
                if (message.file && message.file.length) {
                    object.file = [];
                    for (let j = 0; j < message.file.length; ++j)
                        object.file[j] = $root.google.protobuf.FileDescriptorProto.toObject(message.file[j], options);
                }
                return object;
            };

            /**
             * Converts this FileDescriptorSet to JSON.
             * @function toJSON
             * @memberof google.protobuf.FileDescriptorSet
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FileDescriptorSet.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return FileDescriptorSet;
        })();

        protobuf.FileDescriptorProto = (function() {

            /**
             * Properties of a FileDescriptorProto.
             * @memberof google.protobuf
             * @interface IFileDescriptorProto
             * @property {string|null} [name] FileDescriptorProto name
             * @property {string|null} ["package"] FileDescriptorProto package
             * @property {Array.<string>|null} [dependency] FileDescriptorProto dependency
             * @property {Array.<number>|null} [public_dependency] FileDescriptorProto public_dependency
             * @property {Array.<number>|null} [weak_dependency] FileDescriptorProto weak_dependency
             * @property {Array.<google.protobuf.IDescriptorProto>|null} [message_type] FileDescriptorProto message_type
             * @property {Array.<google.protobuf.IEnumDescriptorProto>|null} [enum_type] FileDescriptorProto enum_type
             * @property {Array.<google.protobuf.IServiceDescriptorProto>|null} [service] FileDescriptorProto service
             * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [extension] FileDescriptorProto extension
             * @property {google.protobuf.IFileOptions|null} [options] FileDescriptorProto options
             * @property {google.protobuf.ISourceCodeInfo|null} [source_code_info] FileDescriptorProto source_code_info
             * @property {string|null} [syntax] FileDescriptorProto syntax
             */

            /**
             * Constructs a new FileDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents a FileDescriptorProto.
             * @implements IFileDescriptorProto
             * @constructor
             * @param {google.protobuf.IFileDescriptorProto=} [properties] Properties to set
             */
            function FileDescriptorProto(properties) {
                this.dependency = [];
                this.public_dependency = [];
                this.weak_dependency = [];
                this.message_type = [];
                this.enum_type = [];
                this.service = [];
                this.extension = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FileDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.name = "";

            /**
             * FileDescriptorProto package.
             * @member {string} package
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype["package"] = "";

            /**
             * FileDescriptorProto dependency.
             * @member {Array.<string>} dependency
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.dependency = $util.emptyArray;

            /**
             * FileDescriptorProto public_dependency.
             * @member {Array.<number>} public_dependency
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.public_dependency = $util.emptyArray;

            /**
             * FileDescriptorProto weak_dependency.
             * @member {Array.<number>} weak_dependency
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.weak_dependency = $util.emptyArray;

            /**
             * FileDescriptorProto message_type.
             * @member {Array.<google.protobuf.IDescriptorProto>} message_type
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.message_type = $util.emptyArray;

            /**
             * FileDescriptorProto enum_type.
             * @member {Array.<google.protobuf.IEnumDescriptorProto>} enum_type
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.enum_type = $util.emptyArray;

            /**
             * FileDescriptorProto service.
             * @member {Array.<google.protobuf.IServiceDescriptorProto>} service
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.service = $util.emptyArray;

            /**
             * FileDescriptorProto extension.
             * @member {Array.<google.protobuf.IFieldDescriptorProto>} extension
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.extension = $util.emptyArray;

            /**
             * FileDescriptorProto options.
             * @member {google.protobuf.IFileOptions|null|undefined} options
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.options = null;

            /**
             * FileDescriptorProto source_code_info.
             * @member {google.protobuf.ISourceCodeInfo|null|undefined} source_code_info
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.source_code_info = null;

            /**
             * FileDescriptorProto syntax.
             * @member {string} syntax
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             */
            FileDescriptorProto.prototype.syntax = "";

            /**
             * Encodes the specified FileDescriptorProto message. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {google.protobuf.IFileDescriptorProto} message FileDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message["package"] != null && Object.hasOwnProperty.call(message, "package"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message["package"]);
                if (message.dependency != null && message.dependency.length)
                    for (let i = 0; i < message.dependency.length; ++i)
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.dependency[i]);
                if (message.message_type != null && message.message_type.length)
                    for (let i = 0; i < message.message_type.length; ++i)
                        $root.google.protobuf.DescriptorProto.encode(message.message_type[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.enum_type != null && message.enum_type.length)
                    for (let i = 0; i < message.enum_type.length; ++i)
                        $root.google.protobuf.EnumDescriptorProto.encode(message.enum_type[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.service != null && message.service.length)
                    for (let i = 0; i < message.service.length; ++i)
                        $root.google.protobuf.ServiceDescriptorProto.encode(message.service[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.extension != null && message.extension.length)
                    for (let i = 0; i < message.extension.length; ++i)
                        $root.google.protobuf.FieldDescriptorProto.encode(message.extension[i], writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.FileOptions.encode(message.options, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.source_code_info != null && Object.hasOwnProperty.call(message, "source_code_info"))
                    $root.google.protobuf.SourceCodeInfo.encode(message.source_code_info, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                if (message.public_dependency != null && message.public_dependency.length)
                    for (let i = 0; i < message.public_dependency.length; ++i)
                        writer.uint32(/* id 10, wireType 0 =*/80).int32(message.public_dependency[i]);
                if (message.weak_dependency != null && message.weak_dependency.length)
                    for (let i = 0; i < message.weak_dependency.length; ++i)
                        writer.uint32(/* id 11, wireType 0 =*/88).int32(message.weak_dependency[i]);
                if (message.syntax != null && Object.hasOwnProperty.call(message, "syntax"))
                    writer.uint32(/* id 12, wireType 2 =*/98).string(message.syntax);
                return writer;
            };

            /**
             * Encodes the specified FileDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {google.protobuf.IFileDescriptorProto} message FileDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.FileDescriptorProto} FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.FileDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message["package"] = reader.string();
                        break;
                    case 3:
                        if (!(message.dependency && message.dependency.length))
                            message.dependency = [];
                        message.dependency.push(reader.string());
                        break;
                    case 10:
                        if (!(message.public_dependency && message.public_dependency.length))
                            message.public_dependency = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.public_dependency.push(reader.int32());
                        } else
                            message.public_dependency.push(reader.int32());
                        break;
                    case 11:
                        if (!(message.weak_dependency && message.weak_dependency.length))
                            message.weak_dependency = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.weak_dependency.push(reader.int32());
                        } else
                            message.weak_dependency.push(reader.int32());
                        break;
                    case 4:
                        if (!(message.message_type && message.message_type.length))
                            message.message_type = [];
                        message.message_type.push($root.google.protobuf.DescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 5:
                        if (!(message.enum_type && message.enum_type.length))
                            message.enum_type = [];
                        message.enum_type.push($root.google.protobuf.EnumDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 6:
                        if (!(message.service && message.service.length))
                            message.service = [];
                        message.service.push($root.google.protobuf.ServiceDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 7:
                        if (!(message.extension && message.extension.length))
                            message.extension = [];
                        message.extension.push($root.google.protobuf.FieldDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 8:
                        message.options = $root.google.protobuf.FileOptions.decode(reader, reader.uint32());
                        break;
                    case 9:
                        message.source_code_info = $root.google.protobuf.SourceCodeInfo.decode(reader, reader.uint32());
                        break;
                    case 12:
                        message.syntax = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.FileDescriptorProto} FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FileDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FileDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message["package"] != null && message.hasOwnProperty("package"))
                    if (!$util.isString(message["package"]))
                        return "package: string expected";
                if (message.dependency != null && message.hasOwnProperty("dependency")) {
                    if (!Array.isArray(message.dependency))
                        return "dependency: array expected";
                    for (let i = 0; i < message.dependency.length; ++i)
                        if (!$util.isString(message.dependency[i]))
                            return "dependency: string[] expected";
                }
                if (message.public_dependency != null && message.hasOwnProperty("public_dependency")) {
                    if (!Array.isArray(message.public_dependency))
                        return "public_dependency: array expected";
                    for (let i = 0; i < message.public_dependency.length; ++i)
                        if (!$util.isInteger(message.public_dependency[i]))
                            return "public_dependency: integer[] expected";
                }
                if (message.weak_dependency != null && message.hasOwnProperty("weak_dependency")) {
                    if (!Array.isArray(message.weak_dependency))
                        return "weak_dependency: array expected";
                    for (let i = 0; i < message.weak_dependency.length; ++i)
                        if (!$util.isInteger(message.weak_dependency[i]))
                            return "weak_dependency: integer[] expected";
                }
                if (message.message_type != null && message.hasOwnProperty("message_type")) {
                    if (!Array.isArray(message.message_type))
                        return "message_type: array expected";
                    for (let i = 0; i < message.message_type.length; ++i) {
                        let error = $root.google.protobuf.DescriptorProto.verify(message.message_type[i]);
                        if (error)
                            return "message_type." + error;
                    }
                }
                if (message.enum_type != null && message.hasOwnProperty("enum_type")) {
                    if (!Array.isArray(message.enum_type))
                        return "enum_type: array expected";
                    for (let i = 0; i < message.enum_type.length; ++i) {
                        let error = $root.google.protobuf.EnumDescriptorProto.verify(message.enum_type[i]);
                        if (error)
                            return "enum_type." + error;
                    }
                }
                if (message.service != null && message.hasOwnProperty("service")) {
                    if (!Array.isArray(message.service))
                        return "service: array expected";
                    for (let i = 0; i < message.service.length; ++i) {
                        let error = $root.google.protobuf.ServiceDescriptorProto.verify(message.service[i]);
                        if (error)
                            return "service." + error;
                    }
                }
                if (message.extension != null && message.hasOwnProperty("extension")) {
                    if (!Array.isArray(message.extension))
                        return "extension: array expected";
                    for (let i = 0; i < message.extension.length; ++i) {
                        let error = $root.google.protobuf.FieldDescriptorProto.verify(message.extension[i]);
                        if (error)
                            return "extension." + error;
                    }
                }
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.FileOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                if (message.source_code_info != null && message.hasOwnProperty("source_code_info")) {
                    let error = $root.google.protobuf.SourceCodeInfo.verify(message.source_code_info);
                    if (error)
                        return "source_code_info." + error;
                }
                if (message.syntax != null && message.hasOwnProperty("syntax"))
                    if (!$util.isString(message.syntax))
                        return "syntax: string expected";
                return null;
            };

            /**
             * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.FileDescriptorProto} FileDescriptorProto
             */
            FileDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.FileDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.FileDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object["package"] != null)
                    message["package"] = String(object["package"]);
                if (object.dependency) {
                    if (!Array.isArray(object.dependency))
                        throw TypeError(".google.protobuf.FileDescriptorProto.dependency: array expected");
                    message.dependency = [];
                    for (let i = 0; i < object.dependency.length; ++i)
                        message.dependency[i] = String(object.dependency[i]);
                }
                if (object.public_dependency) {
                    if (!Array.isArray(object.public_dependency))
                        throw TypeError(".google.protobuf.FileDescriptorProto.public_dependency: array expected");
                    message.public_dependency = [];
                    for (let i = 0; i < object.public_dependency.length; ++i)
                        message.public_dependency[i] = object.public_dependency[i] | 0;
                }
                if (object.weak_dependency) {
                    if (!Array.isArray(object.weak_dependency))
                        throw TypeError(".google.protobuf.FileDescriptorProto.weak_dependency: array expected");
                    message.weak_dependency = [];
                    for (let i = 0; i < object.weak_dependency.length; ++i)
                        message.weak_dependency[i] = object.weak_dependency[i] | 0;
                }
                if (object.message_type) {
                    if (!Array.isArray(object.message_type))
                        throw TypeError(".google.protobuf.FileDescriptorProto.message_type: array expected");
                    message.message_type = [];
                    for (let i = 0; i < object.message_type.length; ++i) {
                        if (typeof object.message_type[i] !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.message_type: object expected");
                        message.message_type[i] = $root.google.protobuf.DescriptorProto.fromObject(object.message_type[i]);
                    }
                }
                if (object.enum_type) {
                    if (!Array.isArray(object.enum_type))
                        throw TypeError(".google.protobuf.FileDescriptorProto.enum_type: array expected");
                    message.enum_type = [];
                    for (let i = 0; i < object.enum_type.length; ++i) {
                        if (typeof object.enum_type[i] !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.enum_type: object expected");
                        message.enum_type[i] = $root.google.protobuf.EnumDescriptorProto.fromObject(object.enum_type[i]);
                    }
                }
                if (object.service) {
                    if (!Array.isArray(object.service))
                        throw TypeError(".google.protobuf.FileDescriptorProto.service: array expected");
                    message.service = [];
                    for (let i = 0; i < object.service.length; ++i) {
                        if (typeof object.service[i] !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.service: object expected");
                        message.service[i] = $root.google.protobuf.ServiceDescriptorProto.fromObject(object.service[i]);
                    }
                }
                if (object.extension) {
                    if (!Array.isArray(object.extension))
                        throw TypeError(".google.protobuf.FileDescriptorProto.extension: array expected");
                    message.extension = [];
                    for (let i = 0; i < object.extension.length; ++i) {
                        if (typeof object.extension[i] !== "object")
                            throw TypeError(".google.protobuf.FileDescriptorProto.extension: object expected");
                        message.extension[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.extension[i]);
                    }
                }
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.FileDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.FileOptions.fromObject(object.options);
                }
                if (object.source_code_info != null) {
                    if (typeof object.source_code_info !== "object")
                        throw TypeError(".google.protobuf.FileDescriptorProto.source_code_info: object expected");
                    message.source_code_info = $root.google.protobuf.SourceCodeInfo.fromObject(object.source_code_info);
                }
                if (object.syntax != null)
                    message.syntax = String(object.syntax);
                return message;
            };

            /**
             * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.FileDescriptorProto
             * @static
             * @param {google.protobuf.FileDescriptorProto} message FileDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FileDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.dependency = [];
                    object.message_type = [];
                    object.enum_type = [];
                    object.service = [];
                    object.extension = [];
                    object.public_dependency = [];
                    object.weak_dependency = [];
                }
                if (options.defaults) {
                    object.name = "";
                    object["package"] = "";
                    object.options = null;
                    object.source_code_info = null;
                    object.syntax = "";
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message["package"] != null && message.hasOwnProperty("package"))
                    object["package"] = message["package"];
                if (message.dependency && message.dependency.length) {
                    object.dependency = [];
                    for (let j = 0; j < message.dependency.length; ++j)
                        object.dependency[j] = message.dependency[j];
                }
                if (message.message_type && message.message_type.length) {
                    object.message_type = [];
                    for (let j = 0; j < message.message_type.length; ++j)
                        object.message_type[j] = $root.google.protobuf.DescriptorProto.toObject(message.message_type[j], options);
                }
                if (message.enum_type && message.enum_type.length) {
                    object.enum_type = [];
                    for (let j = 0; j < message.enum_type.length; ++j)
                        object.enum_type[j] = $root.google.protobuf.EnumDescriptorProto.toObject(message.enum_type[j], options);
                }
                if (message.service && message.service.length) {
                    object.service = [];
                    for (let j = 0; j < message.service.length; ++j)
                        object.service[j] = $root.google.protobuf.ServiceDescriptorProto.toObject(message.service[j], options);
                }
                if (message.extension && message.extension.length) {
                    object.extension = [];
                    for (let j = 0; j < message.extension.length; ++j)
                        object.extension[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.extension[j], options);
                }
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.FileOptions.toObject(message.options, options);
                if (message.source_code_info != null && message.hasOwnProperty("source_code_info"))
                    object.source_code_info = $root.google.protobuf.SourceCodeInfo.toObject(message.source_code_info, options);
                if (message.public_dependency && message.public_dependency.length) {
                    object.public_dependency = [];
                    for (let j = 0; j < message.public_dependency.length; ++j)
                        object.public_dependency[j] = message.public_dependency[j];
                }
                if (message.weak_dependency && message.weak_dependency.length) {
                    object.weak_dependency = [];
                    for (let j = 0; j < message.weak_dependency.length; ++j)
                        object.weak_dependency[j] = message.weak_dependency[j];
                }
                if (message.syntax != null && message.hasOwnProperty("syntax"))
                    object.syntax = message.syntax;
                return object;
            };

            /**
             * Converts this FileDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.FileDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FileDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return FileDescriptorProto;
        })();

        protobuf.DescriptorProto = (function() {

            /**
             * Properties of a DescriptorProto.
             * @memberof google.protobuf
             * @interface IDescriptorProto
             * @property {string|null} [name] DescriptorProto name
             * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [field] DescriptorProto field
             * @property {Array.<google.protobuf.IFieldDescriptorProto>|null} [extension] DescriptorProto extension
             * @property {Array.<google.protobuf.IDescriptorProto>|null} [nested_type] DescriptorProto nested_type
             * @property {Array.<google.protobuf.IEnumDescriptorProto>|null} [enum_type] DescriptorProto enum_type
             * @property {Array.<google.protobuf.DescriptorProto.IExtensionRange>|null} [extension_range] DescriptorProto extension_range
             * @property {Array.<google.protobuf.IOneofDescriptorProto>|null} [oneof_decl] DescriptorProto oneof_decl
             * @property {google.protobuf.IMessageOptions|null} [options] DescriptorProto options
             * @property {Array.<google.protobuf.DescriptorProto.IReservedRange>|null} [reserved_range] DescriptorProto reserved_range
             * @property {Array.<string>|null} [reserved_name] DescriptorProto reserved_name
             */

            /**
             * Constructs a new DescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents a DescriptorProto.
             * @implements IDescriptorProto
             * @constructor
             * @param {google.protobuf.IDescriptorProto=} [properties] Properties to set
             */
            function DescriptorProto(properties) {
                this.field = [];
                this.extension = [];
                this.nested_type = [];
                this.enum_type = [];
                this.extension_range = [];
                this.oneof_decl = [];
                this.reserved_range = [];
                this.reserved_name = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * DescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.name = "";

            /**
             * DescriptorProto field.
             * @member {Array.<google.protobuf.IFieldDescriptorProto>} field
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.field = $util.emptyArray;

            /**
             * DescriptorProto extension.
             * @member {Array.<google.protobuf.IFieldDescriptorProto>} extension
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.extension = $util.emptyArray;

            /**
             * DescriptorProto nested_type.
             * @member {Array.<google.protobuf.IDescriptorProto>} nested_type
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.nested_type = $util.emptyArray;

            /**
             * DescriptorProto enum_type.
             * @member {Array.<google.protobuf.IEnumDescriptorProto>} enum_type
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.enum_type = $util.emptyArray;

            /**
             * DescriptorProto extension_range.
             * @member {Array.<google.protobuf.DescriptorProto.IExtensionRange>} extension_range
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.extension_range = $util.emptyArray;

            /**
             * DescriptorProto oneof_decl.
             * @member {Array.<google.protobuf.IOneofDescriptorProto>} oneof_decl
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.oneof_decl = $util.emptyArray;

            /**
             * DescriptorProto options.
             * @member {google.protobuf.IMessageOptions|null|undefined} options
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.options = null;

            /**
             * DescriptorProto reserved_range.
             * @member {Array.<google.protobuf.DescriptorProto.IReservedRange>} reserved_range
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.reserved_range = $util.emptyArray;

            /**
             * DescriptorProto reserved_name.
             * @member {Array.<string>} reserved_name
             * @memberof google.protobuf.DescriptorProto
             * @instance
             */
            DescriptorProto.prototype.reserved_name = $util.emptyArray;

            /**
             * Encodes the specified DescriptorProto message. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {google.protobuf.IDescriptorProto} message DescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.field != null && message.field.length)
                    for (let i = 0; i < message.field.length; ++i)
                        $root.google.protobuf.FieldDescriptorProto.encode(message.field[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.nested_type != null && message.nested_type.length)
                    for (let i = 0; i < message.nested_type.length; ++i)
                        $root.google.protobuf.DescriptorProto.encode(message.nested_type[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.enum_type != null && message.enum_type.length)
                    for (let i = 0; i < message.enum_type.length; ++i)
                        $root.google.protobuf.EnumDescriptorProto.encode(message.enum_type[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.extension_range != null && message.extension_range.length)
                    for (let i = 0; i < message.extension_range.length; ++i)
                        $root.google.protobuf.DescriptorProto.ExtensionRange.encode(message.extension_range[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.extension != null && message.extension.length)
                    for (let i = 0; i < message.extension.length; ++i)
                        $root.google.protobuf.FieldDescriptorProto.encode(message.extension[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.MessageOptions.encode(message.options, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.oneof_decl != null && message.oneof_decl.length)
                    for (let i = 0; i < message.oneof_decl.length; ++i)
                        $root.google.protobuf.OneofDescriptorProto.encode(message.oneof_decl[i], writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.reserved_range != null && message.reserved_range.length)
                    for (let i = 0; i < message.reserved_range.length; ++i)
                        $root.google.protobuf.DescriptorProto.ReservedRange.encode(message.reserved_range[i], writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                if (message.reserved_name != null && message.reserved_name.length)
                    for (let i = 0; i < message.reserved_name.length; ++i)
                        writer.uint32(/* id 10, wireType 2 =*/82).string(message.reserved_name[i]);
                return writer;
            };

            /**
             * Encodes the specified DescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {google.protobuf.IDescriptorProto} message DescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            DescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.DescriptorProto} DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.DescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        if (!(message.field && message.field.length))
                            message.field = [];
                        message.field.push($root.google.protobuf.FieldDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 6:
                        if (!(message.extension && message.extension.length))
                            message.extension = [];
                        message.extension.push($root.google.protobuf.FieldDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 3:
                        if (!(message.nested_type && message.nested_type.length))
                            message.nested_type = [];
                        message.nested_type.push($root.google.protobuf.DescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 4:
                        if (!(message.enum_type && message.enum_type.length))
                            message.enum_type = [];
                        message.enum_type.push($root.google.protobuf.EnumDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 5:
                        if (!(message.extension_range && message.extension_range.length))
                            message.extension_range = [];
                        message.extension_range.push($root.google.protobuf.DescriptorProto.ExtensionRange.decode(reader, reader.uint32()));
                        break;
                    case 8:
                        if (!(message.oneof_decl && message.oneof_decl.length))
                            message.oneof_decl = [];
                        message.oneof_decl.push($root.google.protobuf.OneofDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 7:
                        message.options = $root.google.protobuf.MessageOptions.decode(reader, reader.uint32());
                        break;
                    case 9:
                        if (!(message.reserved_range && message.reserved_range.length))
                            message.reserved_range = [];
                        message.reserved_range.push($root.google.protobuf.DescriptorProto.ReservedRange.decode(reader, reader.uint32()));
                        break;
                    case 10:
                        if (!(message.reserved_name && message.reserved_name.length))
                            message.reserved_name = [];
                        message.reserved_name.push(reader.string());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.DescriptorProto} DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            DescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a DescriptorProto message.
             * @function verify
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            DescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.field != null && message.hasOwnProperty("field")) {
                    if (!Array.isArray(message.field))
                        return "field: array expected";
                    for (let i = 0; i < message.field.length; ++i) {
                        let error = $root.google.protobuf.FieldDescriptorProto.verify(message.field[i]);
                        if (error)
                            return "field." + error;
                    }
                }
                if (message.extension != null && message.hasOwnProperty("extension")) {
                    if (!Array.isArray(message.extension))
                        return "extension: array expected";
                    for (let i = 0; i < message.extension.length; ++i) {
                        let error = $root.google.protobuf.FieldDescriptorProto.verify(message.extension[i]);
                        if (error)
                            return "extension." + error;
                    }
                }
                if (message.nested_type != null && message.hasOwnProperty("nested_type")) {
                    if (!Array.isArray(message.nested_type))
                        return "nested_type: array expected";
                    for (let i = 0; i < message.nested_type.length; ++i) {
                        let error = $root.google.protobuf.DescriptorProto.verify(message.nested_type[i]);
                        if (error)
                            return "nested_type." + error;
                    }
                }
                if (message.enum_type != null && message.hasOwnProperty("enum_type")) {
                    if (!Array.isArray(message.enum_type))
                        return "enum_type: array expected";
                    for (let i = 0; i < message.enum_type.length; ++i) {
                        let error = $root.google.protobuf.EnumDescriptorProto.verify(message.enum_type[i]);
                        if (error)
                            return "enum_type." + error;
                    }
                }
                if (message.extension_range != null && message.hasOwnProperty("extension_range")) {
                    if (!Array.isArray(message.extension_range))
                        return "extension_range: array expected";
                    for (let i = 0; i < message.extension_range.length; ++i) {
                        let error = $root.google.protobuf.DescriptorProto.ExtensionRange.verify(message.extension_range[i]);
                        if (error)
                            return "extension_range." + error;
                    }
                }
                if (message.oneof_decl != null && message.hasOwnProperty("oneof_decl")) {
                    if (!Array.isArray(message.oneof_decl))
                        return "oneof_decl: array expected";
                    for (let i = 0; i < message.oneof_decl.length; ++i) {
                        let error = $root.google.protobuf.OneofDescriptorProto.verify(message.oneof_decl[i]);
                        if (error)
                            return "oneof_decl." + error;
                    }
                }
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.MessageOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                if (message.reserved_range != null && message.hasOwnProperty("reserved_range")) {
                    if (!Array.isArray(message.reserved_range))
                        return "reserved_range: array expected";
                    for (let i = 0; i < message.reserved_range.length; ++i) {
                        let error = $root.google.protobuf.DescriptorProto.ReservedRange.verify(message.reserved_range[i]);
                        if (error)
                            return "reserved_range." + error;
                    }
                }
                if (message.reserved_name != null && message.hasOwnProperty("reserved_name")) {
                    if (!Array.isArray(message.reserved_name))
                        return "reserved_name: array expected";
                    for (let i = 0; i < message.reserved_name.length; ++i)
                        if (!$util.isString(message.reserved_name[i]))
                            return "reserved_name: string[] expected";
                }
                return null;
            };

            /**
             * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.DescriptorProto} DescriptorProto
             */
            DescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.DescriptorProto)
                    return object;
                let message = new $root.google.protobuf.DescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.field) {
                    if (!Array.isArray(object.field))
                        throw TypeError(".google.protobuf.DescriptorProto.field: array expected");
                    message.field = [];
                    for (let i = 0; i < object.field.length; ++i) {
                        if (typeof object.field[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.field: object expected");
                        message.field[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.field[i]);
                    }
                }
                if (object.extension) {
                    if (!Array.isArray(object.extension))
                        throw TypeError(".google.protobuf.DescriptorProto.extension: array expected");
                    message.extension = [];
                    for (let i = 0; i < object.extension.length; ++i) {
                        if (typeof object.extension[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.extension: object expected");
                        message.extension[i] = $root.google.protobuf.FieldDescriptorProto.fromObject(object.extension[i]);
                    }
                }
                if (object.nested_type) {
                    if (!Array.isArray(object.nested_type))
                        throw TypeError(".google.protobuf.DescriptorProto.nested_type: array expected");
                    message.nested_type = [];
                    for (let i = 0; i < object.nested_type.length; ++i) {
                        if (typeof object.nested_type[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.nested_type: object expected");
                        message.nested_type[i] = $root.google.protobuf.DescriptorProto.fromObject(object.nested_type[i]);
                    }
                }
                if (object.enum_type) {
                    if (!Array.isArray(object.enum_type))
                        throw TypeError(".google.protobuf.DescriptorProto.enum_type: array expected");
                    message.enum_type = [];
                    for (let i = 0; i < object.enum_type.length; ++i) {
                        if (typeof object.enum_type[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.enum_type: object expected");
                        message.enum_type[i] = $root.google.protobuf.EnumDescriptorProto.fromObject(object.enum_type[i]);
                    }
                }
                if (object.extension_range) {
                    if (!Array.isArray(object.extension_range))
                        throw TypeError(".google.protobuf.DescriptorProto.extension_range: array expected");
                    message.extension_range = [];
                    for (let i = 0; i < object.extension_range.length; ++i) {
                        if (typeof object.extension_range[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.extension_range: object expected");
                        message.extension_range[i] = $root.google.protobuf.DescriptorProto.ExtensionRange.fromObject(object.extension_range[i]);
                    }
                }
                if (object.oneof_decl) {
                    if (!Array.isArray(object.oneof_decl))
                        throw TypeError(".google.protobuf.DescriptorProto.oneof_decl: array expected");
                    message.oneof_decl = [];
                    for (let i = 0; i < object.oneof_decl.length; ++i) {
                        if (typeof object.oneof_decl[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.oneof_decl: object expected");
                        message.oneof_decl[i] = $root.google.protobuf.OneofDescriptorProto.fromObject(object.oneof_decl[i]);
                    }
                }
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.DescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.MessageOptions.fromObject(object.options);
                }
                if (object.reserved_range) {
                    if (!Array.isArray(object.reserved_range))
                        throw TypeError(".google.protobuf.DescriptorProto.reserved_range: array expected");
                    message.reserved_range = [];
                    for (let i = 0; i < object.reserved_range.length; ++i) {
                        if (typeof object.reserved_range[i] !== "object")
                            throw TypeError(".google.protobuf.DescriptorProto.reserved_range: object expected");
                        message.reserved_range[i] = $root.google.protobuf.DescriptorProto.ReservedRange.fromObject(object.reserved_range[i]);
                    }
                }
                if (object.reserved_name) {
                    if (!Array.isArray(object.reserved_name))
                        throw TypeError(".google.protobuf.DescriptorProto.reserved_name: array expected");
                    message.reserved_name = [];
                    for (let i = 0; i < object.reserved_name.length; ++i)
                        message.reserved_name[i] = String(object.reserved_name[i]);
                }
                return message;
            };

            /**
             * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.DescriptorProto
             * @static
             * @param {google.protobuf.DescriptorProto} message DescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            DescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.field = [];
                    object.nested_type = [];
                    object.enum_type = [];
                    object.extension_range = [];
                    object.extension = [];
                    object.oneof_decl = [];
                    object.reserved_range = [];
                    object.reserved_name = [];
                }
                if (options.defaults) {
                    object.name = "";
                    object.options = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.field && message.field.length) {
                    object.field = [];
                    for (let j = 0; j < message.field.length; ++j)
                        object.field[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.field[j], options);
                }
                if (message.nested_type && message.nested_type.length) {
                    object.nested_type = [];
                    for (let j = 0; j < message.nested_type.length; ++j)
                        object.nested_type[j] = $root.google.protobuf.DescriptorProto.toObject(message.nested_type[j], options);
                }
                if (message.enum_type && message.enum_type.length) {
                    object.enum_type = [];
                    for (let j = 0; j < message.enum_type.length; ++j)
                        object.enum_type[j] = $root.google.protobuf.EnumDescriptorProto.toObject(message.enum_type[j], options);
                }
                if (message.extension_range && message.extension_range.length) {
                    object.extension_range = [];
                    for (let j = 0; j < message.extension_range.length; ++j)
                        object.extension_range[j] = $root.google.protobuf.DescriptorProto.ExtensionRange.toObject(message.extension_range[j], options);
                }
                if (message.extension && message.extension.length) {
                    object.extension = [];
                    for (let j = 0; j < message.extension.length; ++j)
                        object.extension[j] = $root.google.protobuf.FieldDescriptorProto.toObject(message.extension[j], options);
                }
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.MessageOptions.toObject(message.options, options);
                if (message.oneof_decl && message.oneof_decl.length) {
                    object.oneof_decl = [];
                    for (let j = 0; j < message.oneof_decl.length; ++j)
                        object.oneof_decl[j] = $root.google.protobuf.OneofDescriptorProto.toObject(message.oneof_decl[j], options);
                }
                if (message.reserved_range && message.reserved_range.length) {
                    object.reserved_range = [];
                    for (let j = 0; j < message.reserved_range.length; ++j)
                        object.reserved_range[j] = $root.google.protobuf.DescriptorProto.ReservedRange.toObject(message.reserved_range[j], options);
                }
                if (message.reserved_name && message.reserved_name.length) {
                    object.reserved_name = [];
                    for (let j = 0; j < message.reserved_name.length; ++j)
                        object.reserved_name[j] = message.reserved_name[j];
                }
                return object;
            };

            /**
             * Converts this DescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.DescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            DescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            DescriptorProto.ExtensionRange = (function() {

                /**
                 * Properties of an ExtensionRange.
                 * @memberof google.protobuf.DescriptorProto
                 * @interface IExtensionRange
                 * @property {number|null} [start] ExtensionRange start
                 * @property {number|null} [end] ExtensionRange end
                 */

                /**
                 * Constructs a new ExtensionRange.
                 * @memberof google.protobuf.DescriptorProto
                 * @classdesc Represents an ExtensionRange.
                 * @implements IExtensionRange
                 * @constructor
                 * @param {google.protobuf.DescriptorProto.IExtensionRange=} [properties] Properties to set
                 */
                function ExtensionRange(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * ExtensionRange start.
                 * @member {number} start
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @instance
                 */
                ExtensionRange.prototype.start = 0;

                /**
                 * ExtensionRange end.
                 * @member {number} end
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @instance
                 */
                ExtensionRange.prototype.end = 0;

                /**
                 * Encodes the specified ExtensionRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @function encode
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.IExtensionRange} message ExtensionRange message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                ExtensionRange.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.start != null && Object.hasOwnProperty.call(message, "start"))
                        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.start);
                    if (message.end != null && Object.hasOwnProperty.call(message, "end"))
                        writer.uint32(/* id 2, wireType 0 =*/16).int32(message.end);
                    return writer;
                };

                /**
                 * Encodes the specified ExtensionRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.IExtensionRange} message ExtensionRange message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                ExtensionRange.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer.
                 * @function decode
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {google.protobuf.DescriptorProto.ExtensionRange} ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                ExtensionRange.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.DescriptorProto.ExtensionRange();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.start = reader.int32();
                            break;
                        case 2:
                            message.end = reader.int32();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {google.protobuf.DescriptorProto.ExtensionRange} ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                ExtensionRange.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies an ExtensionRange message.
                 * @function verify
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                ExtensionRange.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.start != null && message.hasOwnProperty("start"))
                        if (!$util.isInteger(message.start))
                            return "start: integer expected";
                    if (message.end != null && message.hasOwnProperty("end"))
                        if (!$util.isInteger(message.end))
                            return "end: integer expected";
                    return null;
                };

                /**
                 * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.DescriptorProto.ExtensionRange} ExtensionRange
                 */
                ExtensionRange.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.DescriptorProto.ExtensionRange)
                        return object;
                    let message = new $root.google.protobuf.DescriptorProto.ExtensionRange();
                    if (object.start != null)
                        message.start = object.start | 0;
                    if (object.end != null)
                        message.end = object.end | 0;
                    return message;
                };

                /**
                 * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.ExtensionRange} message ExtensionRange
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ExtensionRange.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.start = 0;
                        object.end = 0;
                    }
                    if (message.start != null && message.hasOwnProperty("start"))
                        object.start = message.start;
                    if (message.end != null && message.hasOwnProperty("end"))
                        object.end = message.end;
                    return object;
                };

                /**
                 * Converts this ExtensionRange to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.DescriptorProto.ExtensionRange
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ExtensionRange.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return ExtensionRange;
            })();

            DescriptorProto.ReservedRange = (function() {

                /**
                 * Properties of a ReservedRange.
                 * @memberof google.protobuf.DescriptorProto
                 * @interface IReservedRange
                 * @property {number|null} [start] ReservedRange start
                 * @property {number|null} [end] ReservedRange end
                 */

                /**
                 * Constructs a new ReservedRange.
                 * @memberof google.protobuf.DescriptorProto
                 * @classdesc Represents a ReservedRange.
                 * @implements IReservedRange
                 * @constructor
                 * @param {google.protobuf.DescriptorProto.IReservedRange=} [properties] Properties to set
                 */
                function ReservedRange(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * ReservedRange start.
                 * @member {number} start
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @instance
                 */
                ReservedRange.prototype.start = 0;

                /**
                 * ReservedRange end.
                 * @member {number} end
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @instance
                 */
                ReservedRange.prototype.end = 0;

                /**
                 * Encodes the specified ReservedRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @function encode
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.IReservedRange} message ReservedRange message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                ReservedRange.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.start != null && Object.hasOwnProperty.call(message, "start"))
                        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.start);
                    if (message.end != null && Object.hasOwnProperty.call(message, "end"))
                        writer.uint32(/* id 2, wireType 0 =*/16).int32(message.end);
                    return writer;
                };

                /**
                 * Encodes the specified ReservedRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.IReservedRange} message ReservedRange message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                ReservedRange.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer.
                 * @function decode
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {google.protobuf.DescriptorProto.ReservedRange} ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                ReservedRange.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.DescriptorProto.ReservedRange();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.start = reader.int32();
                            break;
                        case 2:
                            message.end = reader.int32();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {google.protobuf.DescriptorProto.ReservedRange} ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                ReservedRange.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a ReservedRange message.
                 * @function verify
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                ReservedRange.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.start != null && message.hasOwnProperty("start"))
                        if (!$util.isInteger(message.start))
                            return "start: integer expected";
                    if (message.end != null && message.hasOwnProperty("end"))
                        if (!$util.isInteger(message.end))
                            return "end: integer expected";
                    return null;
                };

                /**
                 * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.DescriptorProto.ReservedRange} ReservedRange
                 */
                ReservedRange.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.DescriptorProto.ReservedRange)
                        return object;
                    let message = new $root.google.protobuf.DescriptorProto.ReservedRange();
                    if (object.start != null)
                        message.start = object.start | 0;
                    if (object.end != null)
                        message.end = object.end | 0;
                    return message;
                };

                /**
                 * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @static
                 * @param {google.protobuf.DescriptorProto.ReservedRange} message ReservedRange
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                ReservedRange.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.start = 0;
                        object.end = 0;
                    }
                    if (message.start != null && message.hasOwnProperty("start"))
                        object.start = message.start;
                    if (message.end != null && message.hasOwnProperty("end"))
                        object.end = message.end;
                    return object;
                };

                /**
                 * Converts this ReservedRange to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.DescriptorProto.ReservedRange
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                ReservedRange.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return ReservedRange;
            })();

            return DescriptorProto;
        })();

        protobuf.FieldDescriptorProto = (function() {

            /**
             * Properties of a FieldDescriptorProto.
             * @memberof google.protobuf
             * @interface IFieldDescriptorProto
             * @property {string|null} [name] FieldDescriptorProto name
             * @property {number|null} [number] FieldDescriptorProto number
             * @property {google.protobuf.FieldDescriptorProto.Label|null} [label] FieldDescriptorProto label
             * @property {google.protobuf.FieldDescriptorProto.Type|null} [type] FieldDescriptorProto type
             * @property {string|null} [type_name] FieldDescriptorProto type_name
             * @property {string|null} [extendee] FieldDescriptorProto extendee
             * @property {string|null} [default_value] FieldDescriptorProto default_value
             * @property {number|null} [oneof_index] FieldDescriptorProto oneof_index
             * @property {string|null} [json_name] FieldDescriptorProto json_name
             * @property {google.protobuf.IFieldOptions|null} [options] FieldDescriptorProto options
             */

            /**
             * Constructs a new FieldDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents a FieldDescriptorProto.
             * @implements IFieldDescriptorProto
             * @constructor
             * @param {google.protobuf.IFieldDescriptorProto=} [properties] Properties to set
             */
            function FieldDescriptorProto(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FieldDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.name = "";

            /**
             * FieldDescriptorProto number.
             * @member {number} number
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.number = 0;

            /**
             * FieldDescriptorProto label.
             * @member {google.protobuf.FieldDescriptorProto.Label} label
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.label = 1;

            /**
             * FieldDescriptorProto type.
             * @member {google.protobuf.FieldDescriptorProto.Type} type
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.type = 1;

            /**
             * FieldDescriptorProto type_name.
             * @member {string} type_name
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.type_name = "";

            /**
             * FieldDescriptorProto extendee.
             * @member {string} extendee
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.extendee = "";

            /**
             * FieldDescriptorProto default_value.
             * @member {string} default_value
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.default_value = "";

            /**
             * FieldDescriptorProto oneof_index.
             * @member {number} oneof_index
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.oneof_index = 0;

            /**
             * FieldDescriptorProto json_name.
             * @member {string} json_name
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.json_name = "";

            /**
             * FieldDescriptorProto options.
             * @member {google.protobuf.IFieldOptions|null|undefined} options
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             */
            FieldDescriptorProto.prototype.options = null;

            /**
             * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {google.protobuf.IFieldDescriptorProto} message FieldDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.extendee != null && Object.hasOwnProperty.call(message, "extendee"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.extendee);
                if (message.number != null && Object.hasOwnProperty.call(message, "number"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.number);
                if (message.label != null && Object.hasOwnProperty.call(message, "label"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.label);
                if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int32(message.type);
                if (message.type_name != null && Object.hasOwnProperty.call(message, "type_name"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.type_name);
                if (message.default_value != null && Object.hasOwnProperty.call(message, "default_value"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.default_value);
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.FieldOptions.encode(message.options, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.oneof_index != null && Object.hasOwnProperty.call(message, "oneof_index"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.oneof_index);
                if (message.json_name != null && Object.hasOwnProperty.call(message, "json_name"))
                    writer.uint32(/* id 10, wireType 2 =*/82).string(message.json_name);
                return writer;
            };

            /**
             * Encodes the specified FieldDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {google.protobuf.IFieldDescriptorProto} message FieldDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.FieldDescriptorProto} FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.FieldDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 3:
                        message.number = reader.int32();
                        break;
                    case 4:
                        message.label = reader.int32();
                        break;
                    case 5:
                        message.type = reader.int32();
                        break;
                    case 6:
                        message.type_name = reader.string();
                        break;
                    case 2:
                        message.extendee = reader.string();
                        break;
                    case 7:
                        message.default_value = reader.string();
                        break;
                    case 9:
                        message.oneof_index = reader.int32();
                        break;
                    case 10:
                        message.json_name = reader.string();
                        break;
                    case 8:
                        message.options = $root.google.protobuf.FieldOptions.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.FieldDescriptorProto} FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FieldDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FieldDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.number != null && message.hasOwnProperty("number"))
                    if (!$util.isInteger(message.number))
                        return "number: integer expected";
                if (message.label != null && message.hasOwnProperty("label"))
                    switch (message.label) {
                    default:
                        return "label: enum value expected";
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.type != null && message.hasOwnProperty("type"))
                    switch (message.type) {
                    default:
                        return "type: enum value expected";
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 18:
                        break;
                    }
                if (message.type_name != null && message.hasOwnProperty("type_name"))
                    if (!$util.isString(message.type_name))
                        return "type_name: string expected";
                if (message.extendee != null && message.hasOwnProperty("extendee"))
                    if (!$util.isString(message.extendee))
                        return "extendee: string expected";
                if (message.default_value != null && message.hasOwnProperty("default_value"))
                    if (!$util.isString(message.default_value))
                        return "default_value: string expected";
                if (message.oneof_index != null && message.hasOwnProperty("oneof_index"))
                    if (!$util.isInteger(message.oneof_index))
                        return "oneof_index: integer expected";
                if (message.json_name != null && message.hasOwnProperty("json_name"))
                    if (!$util.isString(message.json_name))
                        return "json_name: string expected";
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.FieldOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                return null;
            };

            /**
             * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.FieldDescriptorProto} FieldDescriptorProto
             */
            FieldDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.FieldDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.FieldDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.number != null)
                    message.number = object.number | 0;
                switch (object.label) {
                case "LABEL_OPTIONAL":
                case 1:
                    message.label = 1;
                    break;
                case "LABEL_REQUIRED":
                case 2:
                    message.label = 2;
                    break;
                case "LABEL_REPEATED":
                case 3:
                    message.label = 3;
                    break;
                }
                switch (object.type) {
                case "TYPE_DOUBLE":
                case 1:
                    message.type = 1;
                    break;
                case "TYPE_FLOAT":
                case 2:
                    message.type = 2;
                    break;
                case "TYPE_INT64":
                case 3:
                    message.type = 3;
                    break;
                case "TYPE_UINT64":
                case 4:
                    message.type = 4;
                    break;
                case "TYPE_INT32":
                case 5:
                    message.type = 5;
                    break;
                case "TYPE_FIXED64":
                case 6:
                    message.type = 6;
                    break;
                case "TYPE_FIXED32":
                case 7:
                    message.type = 7;
                    break;
                case "TYPE_BOOL":
                case 8:
                    message.type = 8;
                    break;
                case "TYPE_STRING":
                case 9:
                    message.type = 9;
                    break;
                case "TYPE_GROUP":
                case 10:
                    message.type = 10;
                    break;
                case "TYPE_MESSAGE":
                case 11:
                    message.type = 11;
                    break;
                case "TYPE_BYTES":
                case 12:
                    message.type = 12;
                    break;
                case "TYPE_UINT32":
                case 13:
                    message.type = 13;
                    break;
                case "TYPE_ENUM":
                case 14:
                    message.type = 14;
                    break;
                case "TYPE_SFIXED32":
                case 15:
                    message.type = 15;
                    break;
                case "TYPE_SFIXED64":
                case 16:
                    message.type = 16;
                    break;
                case "TYPE_SINT32":
                case 17:
                    message.type = 17;
                    break;
                case "TYPE_SINT64":
                case 18:
                    message.type = 18;
                    break;
                }
                if (object.type_name != null)
                    message.type_name = String(object.type_name);
                if (object.extendee != null)
                    message.extendee = String(object.extendee);
                if (object.default_value != null)
                    message.default_value = String(object.default_value);
                if (object.oneof_index != null)
                    message.oneof_index = object.oneof_index | 0;
                if (object.json_name != null)
                    message.json_name = String(object.json_name);
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.FieldDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.FieldOptions.fromObject(object.options);
                }
                return message;
            };

            /**
             * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.FieldDescriptorProto
             * @static
             * @param {google.protobuf.FieldDescriptorProto} message FieldDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FieldDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.extendee = "";
                    object.number = 0;
                    object.label = options.enums === String ? "LABEL_OPTIONAL" : 1;
                    object.type = options.enums === String ? "TYPE_DOUBLE" : 1;
                    object.type_name = "";
                    object.default_value = "";
                    object.options = null;
                    object.oneof_index = 0;
                    object.json_name = "";
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.extendee != null && message.hasOwnProperty("extendee"))
                    object.extendee = message.extendee;
                if (message.number != null && message.hasOwnProperty("number"))
                    object.number = message.number;
                if (message.label != null && message.hasOwnProperty("label"))
                    object.label = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Label[message.label] : message.label;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = options.enums === String ? $root.google.protobuf.FieldDescriptorProto.Type[message.type] : message.type;
                if (message.type_name != null && message.hasOwnProperty("type_name"))
                    object.type_name = message.type_name;
                if (message.default_value != null && message.hasOwnProperty("default_value"))
                    object.default_value = message.default_value;
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.FieldOptions.toObject(message.options, options);
                if (message.oneof_index != null && message.hasOwnProperty("oneof_index"))
                    object.oneof_index = message.oneof_index;
                if (message.json_name != null && message.hasOwnProperty("json_name"))
                    object.json_name = message.json_name;
                return object;
            };

            /**
             * Converts this FieldDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.FieldDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FieldDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Type enum.
             * @name google.protobuf.FieldDescriptorProto.Type
             * @enum {number}
             * @property {number} TYPE_DOUBLE=1 TYPE_DOUBLE value
             * @property {number} TYPE_FLOAT=2 TYPE_FLOAT value
             * @property {number} TYPE_INT64=3 TYPE_INT64 value
             * @property {number} TYPE_UINT64=4 TYPE_UINT64 value
             * @property {number} TYPE_INT32=5 TYPE_INT32 value
             * @property {number} TYPE_FIXED64=6 TYPE_FIXED64 value
             * @property {number} TYPE_FIXED32=7 TYPE_FIXED32 value
             * @property {number} TYPE_BOOL=8 TYPE_BOOL value
             * @property {number} TYPE_STRING=9 TYPE_STRING value
             * @property {number} TYPE_GROUP=10 TYPE_GROUP value
             * @property {number} TYPE_MESSAGE=11 TYPE_MESSAGE value
             * @property {number} TYPE_BYTES=12 TYPE_BYTES value
             * @property {number} TYPE_UINT32=13 TYPE_UINT32 value
             * @property {number} TYPE_ENUM=14 TYPE_ENUM value
             * @property {number} TYPE_SFIXED32=15 TYPE_SFIXED32 value
             * @property {number} TYPE_SFIXED64=16 TYPE_SFIXED64 value
             * @property {number} TYPE_SINT32=17 TYPE_SINT32 value
             * @property {number} TYPE_SINT64=18 TYPE_SINT64 value
             */
            FieldDescriptorProto.Type = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[1] = "TYPE_DOUBLE"] = 1;
                values[valuesById[2] = "TYPE_FLOAT"] = 2;
                values[valuesById[3] = "TYPE_INT64"] = 3;
                values[valuesById[4] = "TYPE_UINT64"] = 4;
                values[valuesById[5] = "TYPE_INT32"] = 5;
                values[valuesById[6] = "TYPE_FIXED64"] = 6;
                values[valuesById[7] = "TYPE_FIXED32"] = 7;
                values[valuesById[8] = "TYPE_BOOL"] = 8;
                values[valuesById[9] = "TYPE_STRING"] = 9;
                values[valuesById[10] = "TYPE_GROUP"] = 10;
                values[valuesById[11] = "TYPE_MESSAGE"] = 11;
                values[valuesById[12] = "TYPE_BYTES"] = 12;
                values[valuesById[13] = "TYPE_UINT32"] = 13;
                values[valuesById[14] = "TYPE_ENUM"] = 14;
                values[valuesById[15] = "TYPE_SFIXED32"] = 15;
                values[valuesById[16] = "TYPE_SFIXED64"] = 16;
                values[valuesById[17] = "TYPE_SINT32"] = 17;
                values[valuesById[18] = "TYPE_SINT64"] = 18;
                return values;
            })();

            /**
             * Label enum.
             * @name google.protobuf.FieldDescriptorProto.Label
             * @enum {number}
             * @property {number} LABEL_OPTIONAL=1 LABEL_OPTIONAL value
             * @property {number} LABEL_REQUIRED=2 LABEL_REQUIRED value
             * @property {number} LABEL_REPEATED=3 LABEL_REPEATED value
             */
            FieldDescriptorProto.Label = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[1] = "LABEL_OPTIONAL"] = 1;
                values[valuesById[2] = "LABEL_REQUIRED"] = 2;
                values[valuesById[3] = "LABEL_REPEATED"] = 3;
                return values;
            })();

            return FieldDescriptorProto;
        })();

        protobuf.OneofDescriptorProto = (function() {

            /**
             * Properties of an OneofDescriptorProto.
             * @memberof google.protobuf
             * @interface IOneofDescriptorProto
             * @property {string|null} [name] OneofDescriptorProto name
             * @property {google.protobuf.IOneofOptions|null} [options] OneofDescriptorProto options
             */

            /**
             * Constructs a new OneofDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents an OneofDescriptorProto.
             * @implements IOneofDescriptorProto
             * @constructor
             * @param {google.protobuf.IOneofDescriptorProto=} [properties] Properties to set
             */
            function OneofDescriptorProto(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OneofDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.OneofDescriptorProto
             * @instance
             */
            OneofDescriptorProto.prototype.name = "";

            /**
             * OneofDescriptorProto options.
             * @member {google.protobuf.IOneofOptions|null|undefined} options
             * @memberof google.protobuf.OneofDescriptorProto
             * @instance
             */
            OneofDescriptorProto.prototype.options = null;

            /**
             * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {google.protobuf.IOneofDescriptorProto} message OneofDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.OneofOptions.encode(message.options, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified OneofDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {google.protobuf.IOneofDescriptorProto} message OneofDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.OneofDescriptorProto} OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.OneofDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message.options = $root.google.protobuf.OneofOptions.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.OneofDescriptorProto} OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OneofDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OneofDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.OneofOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                return null;
            };

            /**
             * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.OneofDescriptorProto} OneofDescriptorProto
             */
            OneofDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.OneofDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.OneofDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.OneofDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.OneofOptions.fromObject(object.options);
                }
                return message;
            };

            /**
             * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.OneofDescriptorProto
             * @static
             * @param {google.protobuf.OneofDescriptorProto} message OneofDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OneofDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.options = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.OneofOptions.toObject(message.options, options);
                return object;
            };

            /**
             * Converts this OneofDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.OneofDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OneofDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return OneofDescriptorProto;
        })();

        protobuf.EnumDescriptorProto = (function() {

            /**
             * Properties of an EnumDescriptorProto.
             * @memberof google.protobuf
             * @interface IEnumDescriptorProto
             * @property {string|null} [name] EnumDescriptorProto name
             * @property {Array.<google.protobuf.IEnumValueDescriptorProto>|null} [value] EnumDescriptorProto value
             * @property {google.protobuf.IEnumOptions|null} [options] EnumDescriptorProto options
             */

            /**
             * Constructs a new EnumDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents an EnumDescriptorProto.
             * @implements IEnumDescriptorProto
             * @constructor
             * @param {google.protobuf.IEnumDescriptorProto=} [properties] Properties to set
             */
            function EnumDescriptorProto(properties) {
                this.value = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * EnumDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.name = "";

            /**
             * EnumDescriptorProto value.
             * @member {Array.<google.protobuf.IEnumValueDescriptorProto>} value
             * @memberof google.protobuf.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.value = $util.emptyArray;

            /**
             * EnumDescriptorProto options.
             * @member {google.protobuf.IEnumOptions|null|undefined} options
             * @memberof google.protobuf.EnumDescriptorProto
             * @instance
             */
            EnumDescriptorProto.prototype.options = null;

            /**
             * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {google.protobuf.IEnumDescriptorProto} message EnumDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.value != null && message.value.length)
                    for (let i = 0; i < message.value.length; ++i)
                        $root.google.protobuf.EnumValueDescriptorProto.encode(message.value[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.EnumOptions.encode(message.options, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified EnumDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {google.protobuf.IEnumDescriptorProto} message EnumDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.EnumDescriptorProto} EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.EnumDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        if (!(message.value && message.value.length))
                            message.value = [];
                        message.value.push($root.google.protobuf.EnumValueDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 3:
                        message.options = $root.google.protobuf.EnumOptions.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.EnumDescriptorProto} EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an EnumDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            EnumDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.value != null && message.hasOwnProperty("value")) {
                    if (!Array.isArray(message.value))
                        return "value: array expected";
                    for (let i = 0; i < message.value.length; ++i) {
                        let error = $root.google.protobuf.EnumValueDescriptorProto.verify(message.value[i]);
                        if (error)
                            return "value." + error;
                    }
                }
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.EnumOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                return null;
            };

            /**
             * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.EnumDescriptorProto} EnumDescriptorProto
             */
            EnumDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.EnumDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.EnumDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.value) {
                    if (!Array.isArray(object.value))
                        throw TypeError(".google.protobuf.EnumDescriptorProto.value: array expected");
                    message.value = [];
                    for (let i = 0; i < object.value.length; ++i) {
                        if (typeof object.value[i] !== "object")
                            throw TypeError(".google.protobuf.EnumDescriptorProto.value: object expected");
                        message.value[i] = $root.google.protobuf.EnumValueDescriptorProto.fromObject(object.value[i]);
                    }
                }
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.EnumDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.EnumOptions.fromObject(object.options);
                }
                return message;
            };

            /**
             * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.EnumDescriptorProto
             * @static
             * @param {google.protobuf.EnumDescriptorProto} message EnumDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.value = [];
                if (options.defaults) {
                    object.name = "";
                    object.options = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.value && message.value.length) {
                    object.value = [];
                    for (let j = 0; j < message.value.length; ++j)
                        object.value[j] = $root.google.protobuf.EnumValueDescriptorProto.toObject(message.value[j], options);
                }
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.EnumOptions.toObject(message.options, options);
                return object;
            };

            /**
             * Converts this EnumDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.EnumDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return EnumDescriptorProto;
        })();

        protobuf.EnumValueDescriptorProto = (function() {

            /**
             * Properties of an EnumValueDescriptorProto.
             * @memberof google.protobuf
             * @interface IEnumValueDescriptorProto
             * @property {string|null} [name] EnumValueDescriptorProto name
             * @property {number|null} [number] EnumValueDescriptorProto number
             * @property {google.protobuf.IEnumValueOptions|null} [options] EnumValueDescriptorProto options
             */

            /**
             * Constructs a new EnumValueDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents an EnumValueDescriptorProto.
             * @implements IEnumValueDescriptorProto
             * @constructor
             * @param {google.protobuf.IEnumValueDescriptorProto=} [properties] Properties to set
             */
            function EnumValueDescriptorProto(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * EnumValueDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @instance
             */
            EnumValueDescriptorProto.prototype.name = "";

            /**
             * EnumValueDescriptorProto number.
             * @member {number} number
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @instance
             */
            EnumValueDescriptorProto.prototype.number = 0;

            /**
             * EnumValueDescriptorProto options.
             * @member {google.protobuf.IEnumValueOptions|null|undefined} options
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @instance
             */
            EnumValueDescriptorProto.prototype.options = null;

            /**
             * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {google.protobuf.IEnumValueDescriptorProto} message EnumValueDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumValueDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.number != null && Object.hasOwnProperty.call(message, "number"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.number);
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.EnumValueOptions.encode(message.options, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified EnumValueDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {google.protobuf.IEnumValueDescriptorProto} message EnumValueDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumValueDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.EnumValueDescriptorProto} EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumValueDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.EnumValueDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message.number = reader.int32();
                        break;
                    case 3:
                        message.options = $root.google.protobuf.EnumValueOptions.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.EnumValueDescriptorProto} EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumValueDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an EnumValueDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            EnumValueDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.number != null && message.hasOwnProperty("number"))
                    if (!$util.isInteger(message.number))
                        return "number: integer expected";
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.EnumValueOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                return null;
            };

            /**
             * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.EnumValueDescriptorProto} EnumValueDescriptorProto
             */
            EnumValueDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.EnumValueDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.EnumValueDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.number != null)
                    message.number = object.number | 0;
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.EnumValueDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.EnumValueOptions.fromObject(object.options);
                }
                return message;
            };

            /**
             * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @static
             * @param {google.protobuf.EnumValueDescriptorProto} message EnumValueDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumValueDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.number = 0;
                    object.options = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.number != null && message.hasOwnProperty("number"))
                    object.number = message.number;
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.EnumValueOptions.toObject(message.options, options);
                return object;
            };

            /**
             * Converts this EnumValueDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.EnumValueDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumValueDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return EnumValueDescriptorProto;
        })();

        protobuf.ServiceDescriptorProto = (function() {

            /**
             * Properties of a ServiceDescriptorProto.
             * @memberof google.protobuf
             * @interface IServiceDescriptorProto
             * @property {string|null} [name] ServiceDescriptorProto name
             * @property {Array.<google.protobuf.IMethodDescriptorProto>|null} [method] ServiceDescriptorProto method
             * @property {google.protobuf.IServiceOptions|null} [options] ServiceDescriptorProto options
             */

            /**
             * Constructs a new ServiceDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents a ServiceDescriptorProto.
             * @implements IServiceDescriptorProto
             * @constructor
             * @param {google.protobuf.IServiceDescriptorProto=} [properties] Properties to set
             */
            function ServiceDescriptorProto(properties) {
                this.method = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ServiceDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.ServiceDescriptorProto
             * @instance
             */
            ServiceDescriptorProto.prototype.name = "";

            /**
             * ServiceDescriptorProto method.
             * @member {Array.<google.protobuf.IMethodDescriptorProto>} method
             * @memberof google.protobuf.ServiceDescriptorProto
             * @instance
             */
            ServiceDescriptorProto.prototype.method = $util.emptyArray;

            /**
             * ServiceDescriptorProto options.
             * @member {google.protobuf.IServiceOptions|null|undefined} options
             * @memberof google.protobuf.ServiceDescriptorProto
             * @instance
             */
            ServiceDescriptorProto.prototype.options = null;

            /**
             * Encodes the specified ServiceDescriptorProto message. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {google.protobuf.IServiceDescriptorProto} message ServiceDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServiceDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.method != null && message.method.length)
                    for (let i = 0; i < message.method.length; ++i)
                        $root.google.protobuf.MethodDescriptorProto.encode(message.method[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.ServiceOptions.encode(message.options, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ServiceDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {google.protobuf.IServiceDescriptorProto} message ServiceDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServiceDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.ServiceDescriptorProto} ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServiceDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.ServiceDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        if (!(message.method && message.method.length))
                            message.method = [];
                        message.method.push($root.google.protobuf.MethodDescriptorProto.decode(reader, reader.uint32()));
                        break;
                    case 3:
                        message.options = $root.google.protobuf.ServiceOptions.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.ServiceDescriptorProto} ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServiceDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ServiceDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ServiceDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.method != null && message.hasOwnProperty("method")) {
                    if (!Array.isArray(message.method))
                        return "method: array expected";
                    for (let i = 0; i < message.method.length; ++i) {
                        let error = $root.google.protobuf.MethodDescriptorProto.verify(message.method[i]);
                        if (error)
                            return "method." + error;
                    }
                }
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.ServiceOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                return null;
            };

            /**
             * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.ServiceDescriptorProto} ServiceDescriptorProto
             */
            ServiceDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.ServiceDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.ServiceDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.method) {
                    if (!Array.isArray(object.method))
                        throw TypeError(".google.protobuf.ServiceDescriptorProto.method: array expected");
                    message.method = [];
                    for (let i = 0; i < object.method.length; ++i) {
                        if (typeof object.method[i] !== "object")
                            throw TypeError(".google.protobuf.ServiceDescriptorProto.method: object expected");
                        message.method[i] = $root.google.protobuf.MethodDescriptorProto.fromObject(object.method[i]);
                    }
                }
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.ServiceDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.ServiceOptions.fromObject(object.options);
                }
                return message;
            };

            /**
             * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.ServiceDescriptorProto
             * @static
             * @param {google.protobuf.ServiceDescriptorProto} message ServiceDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ServiceDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.method = [];
                if (options.defaults) {
                    object.name = "";
                    object.options = null;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.method && message.method.length) {
                    object.method = [];
                    for (let j = 0; j < message.method.length; ++j)
                        object.method[j] = $root.google.protobuf.MethodDescriptorProto.toObject(message.method[j], options);
                }
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.ServiceOptions.toObject(message.options, options);
                return object;
            };

            /**
             * Converts this ServiceDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.ServiceDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ServiceDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ServiceDescriptorProto;
        })();

        protobuf.MethodDescriptorProto = (function() {

            /**
             * Properties of a MethodDescriptorProto.
             * @memberof google.protobuf
             * @interface IMethodDescriptorProto
             * @property {string|null} [name] MethodDescriptorProto name
             * @property {string|null} [input_type] MethodDescriptorProto input_type
             * @property {string|null} [output_type] MethodDescriptorProto output_type
             * @property {google.protobuf.IMethodOptions|null} [options] MethodDescriptorProto options
             * @property {boolean|null} [client_streaming] MethodDescriptorProto client_streaming
             * @property {boolean|null} [server_streaming] MethodDescriptorProto server_streaming
             */

            /**
             * Constructs a new MethodDescriptorProto.
             * @memberof google.protobuf
             * @classdesc Represents a MethodDescriptorProto.
             * @implements IMethodDescriptorProto
             * @constructor
             * @param {google.protobuf.IMethodDescriptorProto=} [properties] Properties to set
             */
            function MethodDescriptorProto(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MethodDescriptorProto name.
             * @member {string} name
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.name = "";

            /**
             * MethodDescriptorProto input_type.
             * @member {string} input_type
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.input_type = "";

            /**
             * MethodDescriptorProto output_type.
             * @member {string} output_type
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.output_type = "";

            /**
             * MethodDescriptorProto options.
             * @member {google.protobuf.IMethodOptions|null|undefined} options
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.options = null;

            /**
             * MethodDescriptorProto client_streaming.
             * @member {boolean} client_streaming
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.client_streaming = false;

            /**
             * MethodDescriptorProto server_streaming.
             * @member {boolean} server_streaming
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             */
            MethodDescriptorProto.prototype.server_streaming = false;

            /**
             * Encodes the specified MethodDescriptorProto message. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {google.protobuf.IMethodDescriptorProto} message MethodDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MethodDescriptorProto.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.input_type != null && Object.hasOwnProperty.call(message, "input_type"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.input_type);
                if (message.output_type != null && Object.hasOwnProperty.call(message, "output_type"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.output_type);
                if (message.options != null && Object.hasOwnProperty.call(message, "options"))
                    $root.google.protobuf.MethodOptions.encode(message.options, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                if (message.client_streaming != null && Object.hasOwnProperty.call(message, "client_streaming"))
                    writer.uint32(/* id 5, wireType 0 =*/40).bool(message.client_streaming);
                if (message.server_streaming != null && Object.hasOwnProperty.call(message, "server_streaming"))
                    writer.uint32(/* id 6, wireType 0 =*/48).bool(message.server_streaming);
                return writer;
            };

            /**
             * Encodes the specified MethodDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {google.protobuf.IMethodDescriptorProto} message MethodDescriptorProto message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MethodDescriptorProto.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.MethodDescriptorProto} MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MethodDescriptorProto.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.MethodDescriptorProto();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message.input_type = reader.string();
                        break;
                    case 3:
                        message.output_type = reader.string();
                        break;
                    case 4:
                        message.options = $root.google.protobuf.MethodOptions.decode(reader, reader.uint32());
                        break;
                    case 5:
                        message.client_streaming = reader.bool();
                        break;
                    case 6:
                        message.server_streaming = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.MethodDescriptorProto} MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MethodDescriptorProto.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MethodDescriptorProto message.
             * @function verify
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MethodDescriptorProto.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.input_type != null && message.hasOwnProperty("input_type"))
                    if (!$util.isString(message.input_type))
                        return "input_type: string expected";
                if (message.output_type != null && message.hasOwnProperty("output_type"))
                    if (!$util.isString(message.output_type))
                        return "output_type: string expected";
                if (message.options != null && message.hasOwnProperty("options")) {
                    let error = $root.google.protobuf.MethodOptions.verify(message.options);
                    if (error)
                        return "options." + error;
                }
                if (message.client_streaming != null && message.hasOwnProperty("client_streaming"))
                    if (typeof message.client_streaming !== "boolean")
                        return "client_streaming: boolean expected";
                if (message.server_streaming != null && message.hasOwnProperty("server_streaming"))
                    if (typeof message.server_streaming !== "boolean")
                        return "server_streaming: boolean expected";
                return null;
            };

            /**
             * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.MethodDescriptorProto} MethodDescriptorProto
             */
            MethodDescriptorProto.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.MethodDescriptorProto)
                    return object;
                let message = new $root.google.protobuf.MethodDescriptorProto();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.input_type != null)
                    message.input_type = String(object.input_type);
                if (object.output_type != null)
                    message.output_type = String(object.output_type);
                if (object.options != null) {
                    if (typeof object.options !== "object")
                        throw TypeError(".google.protobuf.MethodDescriptorProto.options: object expected");
                    message.options = $root.google.protobuf.MethodOptions.fromObject(object.options);
                }
                if (object.client_streaming != null)
                    message.client_streaming = Boolean(object.client_streaming);
                if (object.server_streaming != null)
                    message.server_streaming = Boolean(object.server_streaming);
                return message;
            };

            /**
             * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.MethodDescriptorProto
             * @static
             * @param {google.protobuf.MethodDescriptorProto} message MethodDescriptorProto
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MethodDescriptorProto.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.name = "";
                    object.input_type = "";
                    object.output_type = "";
                    object.options = null;
                    object.client_streaming = false;
                    object.server_streaming = false;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.input_type != null && message.hasOwnProperty("input_type"))
                    object.input_type = message.input_type;
                if (message.output_type != null && message.hasOwnProperty("output_type"))
                    object.output_type = message.output_type;
                if (message.options != null && message.hasOwnProperty("options"))
                    object.options = $root.google.protobuf.MethodOptions.toObject(message.options, options);
                if (message.client_streaming != null && message.hasOwnProperty("client_streaming"))
                    object.client_streaming = message.client_streaming;
                if (message.server_streaming != null && message.hasOwnProperty("server_streaming"))
                    object.server_streaming = message.server_streaming;
                return object;
            };

            /**
             * Converts this MethodDescriptorProto to JSON.
             * @function toJSON
             * @memberof google.protobuf.MethodDescriptorProto
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MethodDescriptorProto.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return MethodDescriptorProto;
        })();

        protobuf.FileOptions = (function() {

            /**
             * Properties of a FileOptions.
             * @memberof google.protobuf
             * @interface IFileOptions
             * @property {string|null} [java_package] FileOptions java_package
             * @property {string|null} [java_outer_classname] FileOptions java_outer_classname
             * @property {boolean|null} [java_multiple_files] FileOptions java_multiple_files
             * @property {boolean|null} [java_generate_equals_and_hash] FileOptions java_generate_equals_and_hash
             * @property {boolean|null} [java_string_check_utf8] FileOptions java_string_check_utf8
             * @property {google.protobuf.FileOptions.OptimizeMode|null} [optimize_for] FileOptions optimize_for
             * @property {string|null} [go_package] FileOptions go_package
             * @property {boolean|null} [cc_generic_services] FileOptions cc_generic_services
             * @property {boolean|null} [java_generic_services] FileOptions java_generic_services
             * @property {boolean|null} [py_generic_services] FileOptions py_generic_services
             * @property {boolean|null} [deprecated] FileOptions deprecated
             * @property {boolean|null} [cc_enable_arenas] FileOptions cc_enable_arenas
             * @property {string|null} [objc_class_prefix] FileOptions objc_class_prefix
             * @property {string|null} [csharp_namespace] FileOptions csharp_namespace
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] FileOptions uninterpreted_option
             * @property {boolean|null} [".gogoproto.goproto_getters_all"] FileOptions .gogoproto.goproto_getters_all
             * @property {boolean|null} [".gogoproto.goproto_enum_prefix_all"] FileOptions .gogoproto.goproto_enum_prefix_all
             * @property {boolean|null} [".gogoproto.goproto_stringer_all"] FileOptions .gogoproto.goproto_stringer_all
             * @property {boolean|null} [".gogoproto.verbose_equal_all"] FileOptions .gogoproto.verbose_equal_all
             * @property {boolean|null} [".gogoproto.face_all"] FileOptions .gogoproto.face_all
             * @property {boolean|null} [".gogoproto.gostring_all"] FileOptions .gogoproto.gostring_all
             * @property {boolean|null} [".gogoproto.populate_all"] FileOptions .gogoproto.populate_all
             * @property {boolean|null} [".gogoproto.stringer_all"] FileOptions .gogoproto.stringer_all
             * @property {boolean|null} [".gogoproto.onlyone_all"] FileOptions .gogoproto.onlyone_all
             * @property {boolean|null} [".gogoproto.equal_all"] FileOptions .gogoproto.equal_all
             * @property {boolean|null} [".gogoproto.description_all"] FileOptions .gogoproto.description_all
             * @property {boolean|null} [".gogoproto.testgen_all"] FileOptions .gogoproto.testgen_all
             * @property {boolean|null} [".gogoproto.benchgen_all"] FileOptions .gogoproto.benchgen_all
             * @property {boolean|null} [".gogoproto.marshaler_all"] FileOptions .gogoproto.marshaler_all
             * @property {boolean|null} [".gogoproto.unmarshaler_all"] FileOptions .gogoproto.unmarshaler_all
             * @property {boolean|null} [".gogoproto.stable_marshaler_all"] FileOptions .gogoproto.stable_marshaler_all
             * @property {boolean|null} [".gogoproto.sizer_all"] FileOptions .gogoproto.sizer_all
             * @property {boolean|null} [".gogoproto.goproto_enum_stringer_all"] FileOptions .gogoproto.goproto_enum_stringer_all
             * @property {boolean|null} [".gogoproto.enum_stringer_all"] FileOptions .gogoproto.enum_stringer_all
             * @property {boolean|null} [".gogoproto.unsafe_marshaler_all"] FileOptions .gogoproto.unsafe_marshaler_all
             * @property {boolean|null} [".gogoproto.unsafe_unmarshaler_all"] FileOptions .gogoproto.unsafe_unmarshaler_all
             * @property {boolean|null} [".gogoproto.goproto_extensions_map_all"] FileOptions .gogoproto.goproto_extensions_map_all
             * @property {boolean|null} [".gogoproto.goproto_unrecognized_all"] FileOptions .gogoproto.goproto_unrecognized_all
             * @property {boolean|null} [".gogoproto.gogoproto_import"] FileOptions .gogoproto.gogoproto_import
             * @property {boolean|null} [".gogoproto.protosizer_all"] FileOptions .gogoproto.protosizer_all
             * @property {boolean|null} [".gogoproto.compare_all"] FileOptions .gogoproto.compare_all
             * @property {boolean|null} [".gogoproto.typedecl_all"] FileOptions .gogoproto.typedecl_all
             * @property {boolean|null} [".gogoproto.enumdecl_all"] FileOptions .gogoproto.enumdecl_all
             * @property {boolean|null} [".gogoproto.goproto_registration"] FileOptions .gogoproto.goproto_registration
             * @property {boolean|null} [".gogoproto.messagename_all"] FileOptions .gogoproto.messagename_all
             * @property {boolean|null} [".gogoproto.goproto_sizecache_all"] FileOptions .gogoproto.goproto_sizecache_all
             * @property {boolean|null} [".gogoproto.goproto_unkeyed_all"] FileOptions .gogoproto.goproto_unkeyed_all
             * @property {Array.<cosmos_proto.IInterfaceDescriptor>|null} [".cosmos_proto.declare_interface"] FileOptions .cosmos_proto.declare_interface
             * @property {Array.<cosmos_proto.IScalarDescriptor>|null} [".cosmos_proto.declare_scalar"] FileOptions .cosmos_proto.declare_scalar
             */

            /**
             * Constructs a new FileOptions.
             * @memberof google.protobuf
             * @classdesc Represents a FileOptions.
             * @implements IFileOptions
             * @constructor
             * @param {google.protobuf.IFileOptions=} [properties] Properties to set
             */
            function FileOptions(properties) {
                this.uninterpreted_option = [];
                this[".cosmos_proto.declare_interface"] = [];
                this[".cosmos_proto.declare_scalar"] = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FileOptions java_package.
             * @member {string} java_package
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_package = "";

            /**
             * FileOptions java_outer_classname.
             * @member {string} java_outer_classname
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_outer_classname = "";

            /**
             * FileOptions java_multiple_files.
             * @member {boolean} java_multiple_files
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_multiple_files = false;

            /**
             * FileOptions java_generate_equals_and_hash.
             * @member {boolean} java_generate_equals_and_hash
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_generate_equals_and_hash = false;

            /**
             * FileOptions java_string_check_utf8.
             * @member {boolean} java_string_check_utf8
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_string_check_utf8 = false;

            /**
             * FileOptions optimize_for.
             * @member {google.protobuf.FileOptions.OptimizeMode} optimize_for
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.optimize_for = 1;

            /**
             * FileOptions go_package.
             * @member {string} go_package
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.go_package = "";

            /**
             * FileOptions cc_generic_services.
             * @member {boolean} cc_generic_services
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.cc_generic_services = false;

            /**
             * FileOptions java_generic_services.
             * @member {boolean} java_generic_services
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.java_generic_services = false;

            /**
             * FileOptions py_generic_services.
             * @member {boolean} py_generic_services
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.py_generic_services = false;

            /**
             * FileOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.deprecated = false;

            /**
             * FileOptions cc_enable_arenas.
             * @member {boolean} cc_enable_arenas
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.cc_enable_arenas = false;

            /**
             * FileOptions objc_class_prefix.
             * @member {string} objc_class_prefix
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.objc_class_prefix = "";

            /**
             * FileOptions csharp_namespace.
             * @member {string} csharp_namespace
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.csharp_namespace = "";

            /**
             * FileOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * FileOptions .gogoproto.goproto_getters_all.
             * @member {boolean} .gogoproto.goproto_getters_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_getters_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_enum_prefix_all.
             * @member {boolean} .gogoproto.goproto_enum_prefix_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_enum_prefix_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_stringer_all.
             * @member {boolean} .gogoproto.goproto_stringer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_stringer_all"] = false;

            /**
             * FileOptions .gogoproto.verbose_equal_all.
             * @member {boolean} .gogoproto.verbose_equal_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.verbose_equal_all"] = false;

            /**
             * FileOptions .gogoproto.face_all.
             * @member {boolean} .gogoproto.face_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.face_all"] = false;

            /**
             * FileOptions .gogoproto.gostring_all.
             * @member {boolean} .gogoproto.gostring_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.gostring_all"] = false;

            /**
             * FileOptions .gogoproto.populate_all.
             * @member {boolean} .gogoproto.populate_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.populate_all"] = false;

            /**
             * FileOptions .gogoproto.stringer_all.
             * @member {boolean} .gogoproto.stringer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.stringer_all"] = false;

            /**
             * FileOptions .gogoproto.onlyone_all.
             * @member {boolean} .gogoproto.onlyone_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.onlyone_all"] = false;

            /**
             * FileOptions .gogoproto.equal_all.
             * @member {boolean} .gogoproto.equal_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.equal_all"] = false;

            /**
             * FileOptions .gogoproto.description_all.
             * @member {boolean} .gogoproto.description_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.description_all"] = false;

            /**
             * FileOptions .gogoproto.testgen_all.
             * @member {boolean} .gogoproto.testgen_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.testgen_all"] = false;

            /**
             * FileOptions .gogoproto.benchgen_all.
             * @member {boolean} .gogoproto.benchgen_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.benchgen_all"] = false;

            /**
             * FileOptions .gogoproto.marshaler_all.
             * @member {boolean} .gogoproto.marshaler_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.marshaler_all"] = false;

            /**
             * FileOptions .gogoproto.unmarshaler_all.
             * @member {boolean} .gogoproto.unmarshaler_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.unmarshaler_all"] = false;

            /**
             * FileOptions .gogoproto.stable_marshaler_all.
             * @member {boolean} .gogoproto.stable_marshaler_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.stable_marshaler_all"] = false;

            /**
             * FileOptions .gogoproto.sizer_all.
             * @member {boolean} .gogoproto.sizer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.sizer_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_enum_stringer_all.
             * @member {boolean} .gogoproto.goproto_enum_stringer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_enum_stringer_all"] = false;

            /**
             * FileOptions .gogoproto.enum_stringer_all.
             * @member {boolean} .gogoproto.enum_stringer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.enum_stringer_all"] = false;

            /**
             * FileOptions .gogoproto.unsafe_marshaler_all.
             * @member {boolean} .gogoproto.unsafe_marshaler_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.unsafe_marshaler_all"] = false;

            /**
             * FileOptions .gogoproto.unsafe_unmarshaler_all.
             * @member {boolean} .gogoproto.unsafe_unmarshaler_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.unsafe_unmarshaler_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_extensions_map_all.
             * @member {boolean} .gogoproto.goproto_extensions_map_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_extensions_map_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_unrecognized_all.
             * @member {boolean} .gogoproto.goproto_unrecognized_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_unrecognized_all"] = false;

            /**
             * FileOptions .gogoproto.gogoproto_import.
             * @member {boolean} .gogoproto.gogoproto_import
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.gogoproto_import"] = false;

            /**
             * FileOptions .gogoproto.protosizer_all.
             * @member {boolean} .gogoproto.protosizer_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.protosizer_all"] = false;

            /**
             * FileOptions .gogoproto.compare_all.
             * @member {boolean} .gogoproto.compare_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.compare_all"] = false;

            /**
             * FileOptions .gogoproto.typedecl_all.
             * @member {boolean} .gogoproto.typedecl_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.typedecl_all"] = false;

            /**
             * FileOptions .gogoproto.enumdecl_all.
             * @member {boolean} .gogoproto.enumdecl_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.enumdecl_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_registration.
             * @member {boolean} .gogoproto.goproto_registration
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_registration"] = false;

            /**
             * FileOptions .gogoproto.messagename_all.
             * @member {boolean} .gogoproto.messagename_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.messagename_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_sizecache_all.
             * @member {boolean} .gogoproto.goproto_sizecache_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_sizecache_all"] = false;

            /**
             * FileOptions .gogoproto.goproto_unkeyed_all.
             * @member {boolean} .gogoproto.goproto_unkeyed_all
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".gogoproto.goproto_unkeyed_all"] = false;

            /**
             * FileOptions .cosmos_proto.declare_interface.
             * @member {Array.<cosmos_proto.IInterfaceDescriptor>} .cosmos_proto.declare_interface
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".cosmos_proto.declare_interface"] = $util.emptyArray;

            /**
             * FileOptions .cosmos_proto.declare_scalar.
             * @member {Array.<cosmos_proto.IScalarDescriptor>} .cosmos_proto.declare_scalar
             * @memberof google.protobuf.FileOptions
             * @instance
             */
            FileOptions.prototype[".cosmos_proto.declare_scalar"] = $util.emptyArray;

            /**
             * Encodes the specified FileOptions message. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {google.protobuf.IFileOptions} message FileOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.java_package != null && Object.hasOwnProperty.call(message, "java_package"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.java_package);
                if (message.java_outer_classname != null && Object.hasOwnProperty.call(message, "java_outer_classname"))
                    writer.uint32(/* id 8, wireType 2 =*/66).string(message.java_outer_classname);
                if (message.optimize_for != null && Object.hasOwnProperty.call(message, "optimize_for"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.optimize_for);
                if (message.java_multiple_files != null && Object.hasOwnProperty.call(message, "java_multiple_files"))
                    writer.uint32(/* id 10, wireType 0 =*/80).bool(message.java_multiple_files);
                if (message.go_package != null && Object.hasOwnProperty.call(message, "go_package"))
                    writer.uint32(/* id 11, wireType 2 =*/90).string(message.go_package);
                if (message.cc_generic_services != null && Object.hasOwnProperty.call(message, "cc_generic_services"))
                    writer.uint32(/* id 16, wireType 0 =*/128).bool(message.cc_generic_services);
                if (message.java_generic_services != null && Object.hasOwnProperty.call(message, "java_generic_services"))
                    writer.uint32(/* id 17, wireType 0 =*/136).bool(message.java_generic_services);
                if (message.py_generic_services != null && Object.hasOwnProperty.call(message, "py_generic_services"))
                    writer.uint32(/* id 18, wireType 0 =*/144).bool(message.py_generic_services);
                if (message.java_generate_equals_and_hash != null && Object.hasOwnProperty.call(message, "java_generate_equals_and_hash"))
                    writer.uint32(/* id 20, wireType 0 =*/160).bool(message.java_generate_equals_and_hash);
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 23, wireType 0 =*/184).bool(message.deprecated);
                if (message.java_string_check_utf8 != null && Object.hasOwnProperty.call(message, "java_string_check_utf8"))
                    writer.uint32(/* id 27, wireType 0 =*/216).bool(message.java_string_check_utf8);
                if (message.cc_enable_arenas != null && Object.hasOwnProperty.call(message, "cc_enable_arenas"))
                    writer.uint32(/* id 31, wireType 0 =*/248).bool(message.cc_enable_arenas);
                if (message.objc_class_prefix != null && Object.hasOwnProperty.call(message, "objc_class_prefix"))
                    writer.uint32(/* id 36, wireType 2 =*/290).string(message.objc_class_prefix);
                if (message.csharp_namespace != null && Object.hasOwnProperty.call(message, "csharp_namespace"))
                    writer.uint32(/* id 37, wireType 2 =*/298).string(message.csharp_namespace);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".gogoproto.goproto_getters_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_getters_all"))
                    writer.uint32(/* id 63001, wireType 0 =*/504008).bool(message[".gogoproto.goproto_getters_all"]);
                if (message[".gogoproto.goproto_enum_prefix_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_enum_prefix_all"))
                    writer.uint32(/* id 63002, wireType 0 =*/504016).bool(message[".gogoproto.goproto_enum_prefix_all"]);
                if (message[".gogoproto.goproto_stringer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_stringer_all"))
                    writer.uint32(/* id 63003, wireType 0 =*/504024).bool(message[".gogoproto.goproto_stringer_all"]);
                if (message[".gogoproto.verbose_equal_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.verbose_equal_all"))
                    writer.uint32(/* id 63004, wireType 0 =*/504032).bool(message[".gogoproto.verbose_equal_all"]);
                if (message[".gogoproto.face_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.face_all"))
                    writer.uint32(/* id 63005, wireType 0 =*/504040).bool(message[".gogoproto.face_all"]);
                if (message[".gogoproto.gostring_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.gostring_all"))
                    writer.uint32(/* id 63006, wireType 0 =*/504048).bool(message[".gogoproto.gostring_all"]);
                if (message[".gogoproto.populate_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.populate_all"))
                    writer.uint32(/* id 63007, wireType 0 =*/504056).bool(message[".gogoproto.populate_all"]);
                if (message[".gogoproto.stringer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stringer_all"))
                    writer.uint32(/* id 63008, wireType 0 =*/504064).bool(message[".gogoproto.stringer_all"]);
                if (message[".gogoproto.onlyone_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.onlyone_all"))
                    writer.uint32(/* id 63009, wireType 0 =*/504072).bool(message[".gogoproto.onlyone_all"]);
                if (message[".gogoproto.equal_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.equal_all"))
                    writer.uint32(/* id 63013, wireType 0 =*/504104).bool(message[".gogoproto.equal_all"]);
                if (message[".gogoproto.description_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.description_all"))
                    writer.uint32(/* id 63014, wireType 0 =*/504112).bool(message[".gogoproto.description_all"]);
                if (message[".gogoproto.testgen_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.testgen_all"))
                    writer.uint32(/* id 63015, wireType 0 =*/504120).bool(message[".gogoproto.testgen_all"]);
                if (message[".gogoproto.benchgen_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.benchgen_all"))
                    writer.uint32(/* id 63016, wireType 0 =*/504128).bool(message[".gogoproto.benchgen_all"]);
                if (message[".gogoproto.marshaler_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.marshaler_all"))
                    writer.uint32(/* id 63017, wireType 0 =*/504136).bool(message[".gogoproto.marshaler_all"]);
                if (message[".gogoproto.unmarshaler_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unmarshaler_all"))
                    writer.uint32(/* id 63018, wireType 0 =*/504144).bool(message[".gogoproto.unmarshaler_all"]);
                if (message[".gogoproto.stable_marshaler_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stable_marshaler_all"))
                    writer.uint32(/* id 63019, wireType 0 =*/504152).bool(message[".gogoproto.stable_marshaler_all"]);
                if (message[".gogoproto.sizer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.sizer_all"))
                    writer.uint32(/* id 63020, wireType 0 =*/504160).bool(message[".gogoproto.sizer_all"]);
                if (message[".gogoproto.goproto_enum_stringer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_enum_stringer_all"))
                    writer.uint32(/* id 63021, wireType 0 =*/504168).bool(message[".gogoproto.goproto_enum_stringer_all"]);
                if (message[".gogoproto.enum_stringer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enum_stringer_all"))
                    writer.uint32(/* id 63022, wireType 0 =*/504176).bool(message[".gogoproto.enum_stringer_all"]);
                if (message[".gogoproto.unsafe_marshaler_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unsafe_marshaler_all"))
                    writer.uint32(/* id 63023, wireType 0 =*/504184).bool(message[".gogoproto.unsafe_marshaler_all"]);
                if (message[".gogoproto.unsafe_unmarshaler_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unsafe_unmarshaler_all"))
                    writer.uint32(/* id 63024, wireType 0 =*/504192).bool(message[".gogoproto.unsafe_unmarshaler_all"]);
                if (message[".gogoproto.goproto_extensions_map_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_extensions_map_all"))
                    writer.uint32(/* id 63025, wireType 0 =*/504200).bool(message[".gogoproto.goproto_extensions_map_all"]);
                if (message[".gogoproto.goproto_unrecognized_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_unrecognized_all"))
                    writer.uint32(/* id 63026, wireType 0 =*/504208).bool(message[".gogoproto.goproto_unrecognized_all"]);
                if (message[".gogoproto.gogoproto_import"] != null && Object.hasOwnProperty.call(message, ".gogoproto.gogoproto_import"))
                    writer.uint32(/* id 63027, wireType 0 =*/504216).bool(message[".gogoproto.gogoproto_import"]);
                if (message[".gogoproto.protosizer_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.protosizer_all"))
                    writer.uint32(/* id 63028, wireType 0 =*/504224).bool(message[".gogoproto.protosizer_all"]);
                if (message[".gogoproto.compare_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.compare_all"))
                    writer.uint32(/* id 63029, wireType 0 =*/504232).bool(message[".gogoproto.compare_all"]);
                if (message[".gogoproto.typedecl_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.typedecl_all"))
                    writer.uint32(/* id 63030, wireType 0 =*/504240).bool(message[".gogoproto.typedecl_all"]);
                if (message[".gogoproto.enumdecl_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enumdecl_all"))
                    writer.uint32(/* id 63031, wireType 0 =*/504248).bool(message[".gogoproto.enumdecl_all"]);
                if (message[".gogoproto.goproto_registration"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_registration"))
                    writer.uint32(/* id 63032, wireType 0 =*/504256).bool(message[".gogoproto.goproto_registration"]);
                if (message[".gogoproto.messagename_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.messagename_all"))
                    writer.uint32(/* id 63033, wireType 0 =*/504264).bool(message[".gogoproto.messagename_all"]);
                if (message[".gogoproto.goproto_sizecache_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_sizecache_all"))
                    writer.uint32(/* id 63034, wireType 0 =*/504272).bool(message[".gogoproto.goproto_sizecache_all"]);
                if (message[".gogoproto.goproto_unkeyed_all"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_unkeyed_all"))
                    writer.uint32(/* id 63035, wireType 0 =*/504280).bool(message[".gogoproto.goproto_unkeyed_all"]);
                if (message[".cosmos_proto.declare_interface"] != null && message[".cosmos_proto.declare_interface"].length)
                    for (let i = 0; i < message[".cosmos_proto.declare_interface"].length; ++i)
                        $root.cosmos_proto.InterfaceDescriptor.encode(message[".cosmos_proto.declare_interface"][i], writer.uint32(/* id 793021, wireType 2 =*/6344170).fork()).ldelim();
                if (message[".cosmos_proto.declare_scalar"] != null && message[".cosmos_proto.declare_scalar"].length)
                    for (let i = 0; i < message[".cosmos_proto.declare_scalar"].length; ++i)
                        $root.cosmos_proto.ScalarDescriptor.encode(message[".cosmos_proto.declare_scalar"][i], writer.uint32(/* id 793022, wireType 2 =*/6344178).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified FileOptions message, length delimited. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {google.protobuf.IFileOptions} message FileOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FileOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FileOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.FileOptions} FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.FileOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.java_package = reader.string();
                        break;
                    case 8:
                        message.java_outer_classname = reader.string();
                        break;
                    case 10:
                        message.java_multiple_files = reader.bool();
                        break;
                    case 20:
                        message.java_generate_equals_and_hash = reader.bool();
                        break;
                    case 27:
                        message.java_string_check_utf8 = reader.bool();
                        break;
                    case 9:
                        message.optimize_for = reader.int32();
                        break;
                    case 11:
                        message.go_package = reader.string();
                        break;
                    case 16:
                        message.cc_generic_services = reader.bool();
                        break;
                    case 17:
                        message.java_generic_services = reader.bool();
                        break;
                    case 18:
                        message.py_generic_services = reader.bool();
                        break;
                    case 23:
                        message.deprecated = reader.bool();
                        break;
                    case 31:
                        message.cc_enable_arenas = reader.bool();
                        break;
                    case 36:
                        message.objc_class_prefix = reader.string();
                        break;
                    case 37:
                        message.csharp_namespace = reader.string();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 63001:
                        message[".gogoproto.goproto_getters_all"] = reader.bool();
                        break;
                    case 63002:
                        message[".gogoproto.goproto_enum_prefix_all"] = reader.bool();
                        break;
                    case 63003:
                        message[".gogoproto.goproto_stringer_all"] = reader.bool();
                        break;
                    case 63004:
                        message[".gogoproto.verbose_equal_all"] = reader.bool();
                        break;
                    case 63005:
                        message[".gogoproto.face_all"] = reader.bool();
                        break;
                    case 63006:
                        message[".gogoproto.gostring_all"] = reader.bool();
                        break;
                    case 63007:
                        message[".gogoproto.populate_all"] = reader.bool();
                        break;
                    case 63008:
                        message[".gogoproto.stringer_all"] = reader.bool();
                        break;
                    case 63009:
                        message[".gogoproto.onlyone_all"] = reader.bool();
                        break;
                    case 63013:
                        message[".gogoproto.equal_all"] = reader.bool();
                        break;
                    case 63014:
                        message[".gogoproto.description_all"] = reader.bool();
                        break;
                    case 63015:
                        message[".gogoproto.testgen_all"] = reader.bool();
                        break;
                    case 63016:
                        message[".gogoproto.benchgen_all"] = reader.bool();
                        break;
                    case 63017:
                        message[".gogoproto.marshaler_all"] = reader.bool();
                        break;
                    case 63018:
                        message[".gogoproto.unmarshaler_all"] = reader.bool();
                        break;
                    case 63019:
                        message[".gogoproto.stable_marshaler_all"] = reader.bool();
                        break;
                    case 63020:
                        message[".gogoproto.sizer_all"] = reader.bool();
                        break;
                    case 63021:
                        message[".gogoproto.goproto_enum_stringer_all"] = reader.bool();
                        break;
                    case 63022:
                        message[".gogoproto.enum_stringer_all"] = reader.bool();
                        break;
                    case 63023:
                        message[".gogoproto.unsafe_marshaler_all"] = reader.bool();
                        break;
                    case 63024:
                        message[".gogoproto.unsafe_unmarshaler_all"] = reader.bool();
                        break;
                    case 63025:
                        message[".gogoproto.goproto_extensions_map_all"] = reader.bool();
                        break;
                    case 63026:
                        message[".gogoproto.goproto_unrecognized_all"] = reader.bool();
                        break;
                    case 63027:
                        message[".gogoproto.gogoproto_import"] = reader.bool();
                        break;
                    case 63028:
                        message[".gogoproto.protosizer_all"] = reader.bool();
                        break;
                    case 63029:
                        message[".gogoproto.compare_all"] = reader.bool();
                        break;
                    case 63030:
                        message[".gogoproto.typedecl_all"] = reader.bool();
                        break;
                    case 63031:
                        message[".gogoproto.enumdecl_all"] = reader.bool();
                        break;
                    case 63032:
                        message[".gogoproto.goproto_registration"] = reader.bool();
                        break;
                    case 63033:
                        message[".gogoproto.messagename_all"] = reader.bool();
                        break;
                    case 63034:
                        message[".gogoproto.goproto_sizecache_all"] = reader.bool();
                        break;
                    case 63035:
                        message[".gogoproto.goproto_unkeyed_all"] = reader.bool();
                        break;
                    case 793021:
                        if (!(message[".cosmos_proto.declare_interface"] && message[".cosmos_proto.declare_interface"].length))
                            message[".cosmos_proto.declare_interface"] = [];
                        message[".cosmos_proto.declare_interface"].push($root.cosmos_proto.InterfaceDescriptor.decode(reader, reader.uint32()));
                        break;
                    case 793022:
                        if (!(message[".cosmos_proto.declare_scalar"] && message[".cosmos_proto.declare_scalar"].length))
                            message[".cosmos_proto.declare_scalar"] = [];
                        message[".cosmos_proto.declare_scalar"].push($root.cosmos_proto.ScalarDescriptor.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FileOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.FileOptions} FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FileOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FileOptions message.
             * @function verify
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FileOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.java_package != null && message.hasOwnProperty("java_package"))
                    if (!$util.isString(message.java_package))
                        return "java_package: string expected";
                if (message.java_outer_classname != null && message.hasOwnProperty("java_outer_classname"))
                    if (!$util.isString(message.java_outer_classname))
                        return "java_outer_classname: string expected";
                if (message.java_multiple_files != null && message.hasOwnProperty("java_multiple_files"))
                    if (typeof message.java_multiple_files !== "boolean")
                        return "java_multiple_files: boolean expected";
                if (message.java_generate_equals_and_hash != null && message.hasOwnProperty("java_generate_equals_and_hash"))
                    if (typeof message.java_generate_equals_and_hash !== "boolean")
                        return "java_generate_equals_and_hash: boolean expected";
                if (message.java_string_check_utf8 != null && message.hasOwnProperty("java_string_check_utf8"))
                    if (typeof message.java_string_check_utf8 !== "boolean")
                        return "java_string_check_utf8: boolean expected";
                if (message.optimize_for != null && message.hasOwnProperty("optimize_for"))
                    switch (message.optimize_for) {
                    default:
                        return "optimize_for: enum value expected";
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.go_package != null && message.hasOwnProperty("go_package"))
                    if (!$util.isString(message.go_package))
                        return "go_package: string expected";
                if (message.cc_generic_services != null && message.hasOwnProperty("cc_generic_services"))
                    if (typeof message.cc_generic_services !== "boolean")
                        return "cc_generic_services: boolean expected";
                if (message.java_generic_services != null && message.hasOwnProperty("java_generic_services"))
                    if (typeof message.java_generic_services !== "boolean")
                        return "java_generic_services: boolean expected";
                if (message.py_generic_services != null && message.hasOwnProperty("py_generic_services"))
                    if (typeof message.py_generic_services !== "boolean")
                        return "py_generic_services: boolean expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.cc_enable_arenas != null && message.hasOwnProperty("cc_enable_arenas"))
                    if (typeof message.cc_enable_arenas !== "boolean")
                        return "cc_enable_arenas: boolean expected";
                if (message.objc_class_prefix != null && message.hasOwnProperty("objc_class_prefix"))
                    if (!$util.isString(message.objc_class_prefix))
                        return "objc_class_prefix: string expected";
                if (message.csharp_namespace != null && message.hasOwnProperty("csharp_namespace"))
                    if (!$util.isString(message.csharp_namespace))
                        return "csharp_namespace: string expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".gogoproto.goproto_getters_all"] != null && message.hasOwnProperty(".gogoproto.goproto_getters_all"))
                    if (typeof message[".gogoproto.goproto_getters_all"] !== "boolean")
                        return ".gogoproto.goproto_getters_all: boolean expected";
                if (message[".gogoproto.goproto_enum_prefix_all"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_prefix_all"))
                    if (typeof message[".gogoproto.goproto_enum_prefix_all"] !== "boolean")
                        return ".gogoproto.goproto_enum_prefix_all: boolean expected";
                if (message[".gogoproto.goproto_stringer_all"] != null && message.hasOwnProperty(".gogoproto.goproto_stringer_all"))
                    if (typeof message[".gogoproto.goproto_stringer_all"] !== "boolean")
                        return ".gogoproto.goproto_stringer_all: boolean expected";
                if (message[".gogoproto.verbose_equal_all"] != null && message.hasOwnProperty(".gogoproto.verbose_equal_all"))
                    if (typeof message[".gogoproto.verbose_equal_all"] !== "boolean")
                        return ".gogoproto.verbose_equal_all: boolean expected";
                if (message[".gogoproto.face_all"] != null && message.hasOwnProperty(".gogoproto.face_all"))
                    if (typeof message[".gogoproto.face_all"] !== "boolean")
                        return ".gogoproto.face_all: boolean expected";
                if (message[".gogoproto.gostring_all"] != null && message.hasOwnProperty(".gogoproto.gostring_all"))
                    if (typeof message[".gogoproto.gostring_all"] !== "boolean")
                        return ".gogoproto.gostring_all: boolean expected";
                if (message[".gogoproto.populate_all"] != null && message.hasOwnProperty(".gogoproto.populate_all"))
                    if (typeof message[".gogoproto.populate_all"] !== "boolean")
                        return ".gogoproto.populate_all: boolean expected";
                if (message[".gogoproto.stringer_all"] != null && message.hasOwnProperty(".gogoproto.stringer_all"))
                    if (typeof message[".gogoproto.stringer_all"] !== "boolean")
                        return ".gogoproto.stringer_all: boolean expected";
                if (message[".gogoproto.onlyone_all"] != null && message.hasOwnProperty(".gogoproto.onlyone_all"))
                    if (typeof message[".gogoproto.onlyone_all"] !== "boolean")
                        return ".gogoproto.onlyone_all: boolean expected";
                if (message[".gogoproto.equal_all"] != null && message.hasOwnProperty(".gogoproto.equal_all"))
                    if (typeof message[".gogoproto.equal_all"] !== "boolean")
                        return ".gogoproto.equal_all: boolean expected";
                if (message[".gogoproto.description_all"] != null && message.hasOwnProperty(".gogoproto.description_all"))
                    if (typeof message[".gogoproto.description_all"] !== "boolean")
                        return ".gogoproto.description_all: boolean expected";
                if (message[".gogoproto.testgen_all"] != null && message.hasOwnProperty(".gogoproto.testgen_all"))
                    if (typeof message[".gogoproto.testgen_all"] !== "boolean")
                        return ".gogoproto.testgen_all: boolean expected";
                if (message[".gogoproto.benchgen_all"] != null && message.hasOwnProperty(".gogoproto.benchgen_all"))
                    if (typeof message[".gogoproto.benchgen_all"] !== "boolean")
                        return ".gogoproto.benchgen_all: boolean expected";
                if (message[".gogoproto.marshaler_all"] != null && message.hasOwnProperty(".gogoproto.marshaler_all"))
                    if (typeof message[".gogoproto.marshaler_all"] !== "boolean")
                        return ".gogoproto.marshaler_all: boolean expected";
                if (message[".gogoproto.unmarshaler_all"] != null && message.hasOwnProperty(".gogoproto.unmarshaler_all"))
                    if (typeof message[".gogoproto.unmarshaler_all"] !== "boolean")
                        return ".gogoproto.unmarshaler_all: boolean expected";
                if (message[".gogoproto.stable_marshaler_all"] != null && message.hasOwnProperty(".gogoproto.stable_marshaler_all"))
                    if (typeof message[".gogoproto.stable_marshaler_all"] !== "boolean")
                        return ".gogoproto.stable_marshaler_all: boolean expected";
                if (message[".gogoproto.sizer_all"] != null && message.hasOwnProperty(".gogoproto.sizer_all"))
                    if (typeof message[".gogoproto.sizer_all"] !== "boolean")
                        return ".gogoproto.sizer_all: boolean expected";
                if (message[".gogoproto.goproto_enum_stringer_all"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_stringer_all"))
                    if (typeof message[".gogoproto.goproto_enum_stringer_all"] !== "boolean")
                        return ".gogoproto.goproto_enum_stringer_all: boolean expected";
                if (message[".gogoproto.enum_stringer_all"] != null && message.hasOwnProperty(".gogoproto.enum_stringer_all"))
                    if (typeof message[".gogoproto.enum_stringer_all"] !== "boolean")
                        return ".gogoproto.enum_stringer_all: boolean expected";
                if (message[".gogoproto.unsafe_marshaler_all"] != null && message.hasOwnProperty(".gogoproto.unsafe_marshaler_all"))
                    if (typeof message[".gogoproto.unsafe_marshaler_all"] !== "boolean")
                        return ".gogoproto.unsafe_marshaler_all: boolean expected";
                if (message[".gogoproto.unsafe_unmarshaler_all"] != null && message.hasOwnProperty(".gogoproto.unsafe_unmarshaler_all"))
                    if (typeof message[".gogoproto.unsafe_unmarshaler_all"] !== "boolean")
                        return ".gogoproto.unsafe_unmarshaler_all: boolean expected";
                if (message[".gogoproto.goproto_extensions_map_all"] != null && message.hasOwnProperty(".gogoproto.goproto_extensions_map_all"))
                    if (typeof message[".gogoproto.goproto_extensions_map_all"] !== "boolean")
                        return ".gogoproto.goproto_extensions_map_all: boolean expected";
                if (message[".gogoproto.goproto_unrecognized_all"] != null && message.hasOwnProperty(".gogoproto.goproto_unrecognized_all"))
                    if (typeof message[".gogoproto.goproto_unrecognized_all"] !== "boolean")
                        return ".gogoproto.goproto_unrecognized_all: boolean expected";
                if (message[".gogoproto.gogoproto_import"] != null && message.hasOwnProperty(".gogoproto.gogoproto_import"))
                    if (typeof message[".gogoproto.gogoproto_import"] !== "boolean")
                        return ".gogoproto.gogoproto_import: boolean expected";
                if (message[".gogoproto.protosizer_all"] != null && message.hasOwnProperty(".gogoproto.protosizer_all"))
                    if (typeof message[".gogoproto.protosizer_all"] !== "boolean")
                        return ".gogoproto.protosizer_all: boolean expected";
                if (message[".gogoproto.compare_all"] != null && message.hasOwnProperty(".gogoproto.compare_all"))
                    if (typeof message[".gogoproto.compare_all"] !== "boolean")
                        return ".gogoproto.compare_all: boolean expected";
                if (message[".gogoproto.typedecl_all"] != null && message.hasOwnProperty(".gogoproto.typedecl_all"))
                    if (typeof message[".gogoproto.typedecl_all"] !== "boolean")
                        return ".gogoproto.typedecl_all: boolean expected";
                if (message[".gogoproto.enumdecl_all"] != null && message.hasOwnProperty(".gogoproto.enumdecl_all"))
                    if (typeof message[".gogoproto.enumdecl_all"] !== "boolean")
                        return ".gogoproto.enumdecl_all: boolean expected";
                if (message[".gogoproto.goproto_registration"] != null && message.hasOwnProperty(".gogoproto.goproto_registration"))
                    if (typeof message[".gogoproto.goproto_registration"] !== "boolean")
                        return ".gogoproto.goproto_registration: boolean expected";
                if (message[".gogoproto.messagename_all"] != null && message.hasOwnProperty(".gogoproto.messagename_all"))
                    if (typeof message[".gogoproto.messagename_all"] !== "boolean")
                        return ".gogoproto.messagename_all: boolean expected";
                if (message[".gogoproto.goproto_sizecache_all"] != null && message.hasOwnProperty(".gogoproto.goproto_sizecache_all"))
                    if (typeof message[".gogoproto.goproto_sizecache_all"] !== "boolean")
                        return ".gogoproto.goproto_sizecache_all: boolean expected";
                if (message[".gogoproto.goproto_unkeyed_all"] != null && message.hasOwnProperty(".gogoproto.goproto_unkeyed_all"))
                    if (typeof message[".gogoproto.goproto_unkeyed_all"] !== "boolean")
                        return ".gogoproto.goproto_unkeyed_all: boolean expected";
                if (message[".cosmos_proto.declare_interface"] != null && message.hasOwnProperty(".cosmos_proto.declare_interface")) {
                    if (!Array.isArray(message[".cosmos_proto.declare_interface"]))
                        return ".cosmos_proto.declare_interface: array expected";
                    for (let i = 0; i < message[".cosmos_proto.declare_interface"].length; ++i) {
                        let error = $root.cosmos_proto.InterfaceDescriptor.verify(message[".cosmos_proto.declare_interface"][i]);
                        if (error)
                            return ".cosmos_proto.declare_interface." + error;
                    }
                }
                if (message[".cosmos_proto.declare_scalar"] != null && message.hasOwnProperty(".cosmos_proto.declare_scalar")) {
                    if (!Array.isArray(message[".cosmos_proto.declare_scalar"]))
                        return ".cosmos_proto.declare_scalar: array expected";
                    for (let i = 0; i < message[".cosmos_proto.declare_scalar"].length; ++i) {
                        let error = $root.cosmos_proto.ScalarDescriptor.verify(message[".cosmos_proto.declare_scalar"][i]);
                        if (error)
                            return ".cosmos_proto.declare_scalar." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.FileOptions} FileOptions
             */
            FileOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.FileOptions)
                    return object;
                let message = new $root.google.protobuf.FileOptions();
                if (object.java_package != null)
                    message.java_package = String(object.java_package);
                if (object.java_outer_classname != null)
                    message.java_outer_classname = String(object.java_outer_classname);
                if (object.java_multiple_files != null)
                    message.java_multiple_files = Boolean(object.java_multiple_files);
                if (object.java_generate_equals_and_hash != null)
                    message.java_generate_equals_and_hash = Boolean(object.java_generate_equals_and_hash);
                if (object.java_string_check_utf8 != null)
                    message.java_string_check_utf8 = Boolean(object.java_string_check_utf8);
                switch (object.optimize_for) {
                case "SPEED":
                case 1:
                    message.optimize_for = 1;
                    break;
                case "CODE_SIZE":
                case 2:
                    message.optimize_for = 2;
                    break;
                case "LITE_RUNTIME":
                case 3:
                    message.optimize_for = 3;
                    break;
                }
                if (object.go_package != null)
                    message.go_package = String(object.go_package);
                if (object.cc_generic_services != null)
                    message.cc_generic_services = Boolean(object.cc_generic_services);
                if (object.java_generic_services != null)
                    message.java_generic_services = Boolean(object.java_generic_services);
                if (object.py_generic_services != null)
                    message.py_generic_services = Boolean(object.py_generic_services);
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.cc_enable_arenas != null)
                    message.cc_enable_arenas = Boolean(object.cc_enable_arenas);
                if (object.objc_class_prefix != null)
                    message.objc_class_prefix = String(object.objc_class_prefix);
                if (object.csharp_namespace != null)
                    message.csharp_namespace = String(object.csharp_namespace);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.FileOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.FileOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".gogoproto.goproto_getters_all"] != null)
                    message[".gogoproto.goproto_getters_all"] = Boolean(object[".gogoproto.goproto_getters_all"]);
                if (object[".gogoproto.goproto_enum_prefix_all"] != null)
                    message[".gogoproto.goproto_enum_prefix_all"] = Boolean(object[".gogoproto.goproto_enum_prefix_all"]);
                if (object[".gogoproto.goproto_stringer_all"] != null)
                    message[".gogoproto.goproto_stringer_all"] = Boolean(object[".gogoproto.goproto_stringer_all"]);
                if (object[".gogoproto.verbose_equal_all"] != null)
                    message[".gogoproto.verbose_equal_all"] = Boolean(object[".gogoproto.verbose_equal_all"]);
                if (object[".gogoproto.face_all"] != null)
                    message[".gogoproto.face_all"] = Boolean(object[".gogoproto.face_all"]);
                if (object[".gogoproto.gostring_all"] != null)
                    message[".gogoproto.gostring_all"] = Boolean(object[".gogoproto.gostring_all"]);
                if (object[".gogoproto.populate_all"] != null)
                    message[".gogoproto.populate_all"] = Boolean(object[".gogoproto.populate_all"]);
                if (object[".gogoproto.stringer_all"] != null)
                    message[".gogoproto.stringer_all"] = Boolean(object[".gogoproto.stringer_all"]);
                if (object[".gogoproto.onlyone_all"] != null)
                    message[".gogoproto.onlyone_all"] = Boolean(object[".gogoproto.onlyone_all"]);
                if (object[".gogoproto.equal_all"] != null)
                    message[".gogoproto.equal_all"] = Boolean(object[".gogoproto.equal_all"]);
                if (object[".gogoproto.description_all"] != null)
                    message[".gogoproto.description_all"] = Boolean(object[".gogoproto.description_all"]);
                if (object[".gogoproto.testgen_all"] != null)
                    message[".gogoproto.testgen_all"] = Boolean(object[".gogoproto.testgen_all"]);
                if (object[".gogoproto.benchgen_all"] != null)
                    message[".gogoproto.benchgen_all"] = Boolean(object[".gogoproto.benchgen_all"]);
                if (object[".gogoproto.marshaler_all"] != null)
                    message[".gogoproto.marshaler_all"] = Boolean(object[".gogoproto.marshaler_all"]);
                if (object[".gogoproto.unmarshaler_all"] != null)
                    message[".gogoproto.unmarshaler_all"] = Boolean(object[".gogoproto.unmarshaler_all"]);
                if (object[".gogoproto.stable_marshaler_all"] != null)
                    message[".gogoproto.stable_marshaler_all"] = Boolean(object[".gogoproto.stable_marshaler_all"]);
                if (object[".gogoproto.sizer_all"] != null)
                    message[".gogoproto.sizer_all"] = Boolean(object[".gogoproto.sizer_all"]);
                if (object[".gogoproto.goproto_enum_stringer_all"] != null)
                    message[".gogoproto.goproto_enum_stringer_all"] = Boolean(object[".gogoproto.goproto_enum_stringer_all"]);
                if (object[".gogoproto.enum_stringer_all"] != null)
                    message[".gogoproto.enum_stringer_all"] = Boolean(object[".gogoproto.enum_stringer_all"]);
                if (object[".gogoproto.unsafe_marshaler_all"] != null)
                    message[".gogoproto.unsafe_marshaler_all"] = Boolean(object[".gogoproto.unsafe_marshaler_all"]);
                if (object[".gogoproto.unsafe_unmarshaler_all"] != null)
                    message[".gogoproto.unsafe_unmarshaler_all"] = Boolean(object[".gogoproto.unsafe_unmarshaler_all"]);
                if (object[".gogoproto.goproto_extensions_map_all"] != null)
                    message[".gogoproto.goproto_extensions_map_all"] = Boolean(object[".gogoproto.goproto_extensions_map_all"]);
                if (object[".gogoproto.goproto_unrecognized_all"] != null)
                    message[".gogoproto.goproto_unrecognized_all"] = Boolean(object[".gogoproto.goproto_unrecognized_all"]);
                if (object[".gogoproto.gogoproto_import"] != null)
                    message[".gogoproto.gogoproto_import"] = Boolean(object[".gogoproto.gogoproto_import"]);
                if (object[".gogoproto.protosizer_all"] != null)
                    message[".gogoproto.protosizer_all"] = Boolean(object[".gogoproto.protosizer_all"]);
                if (object[".gogoproto.compare_all"] != null)
                    message[".gogoproto.compare_all"] = Boolean(object[".gogoproto.compare_all"]);
                if (object[".gogoproto.typedecl_all"] != null)
                    message[".gogoproto.typedecl_all"] = Boolean(object[".gogoproto.typedecl_all"]);
                if (object[".gogoproto.enumdecl_all"] != null)
                    message[".gogoproto.enumdecl_all"] = Boolean(object[".gogoproto.enumdecl_all"]);
                if (object[".gogoproto.goproto_registration"] != null)
                    message[".gogoproto.goproto_registration"] = Boolean(object[".gogoproto.goproto_registration"]);
                if (object[".gogoproto.messagename_all"] != null)
                    message[".gogoproto.messagename_all"] = Boolean(object[".gogoproto.messagename_all"]);
                if (object[".gogoproto.goproto_sizecache_all"] != null)
                    message[".gogoproto.goproto_sizecache_all"] = Boolean(object[".gogoproto.goproto_sizecache_all"]);
                if (object[".gogoproto.goproto_unkeyed_all"] != null)
                    message[".gogoproto.goproto_unkeyed_all"] = Boolean(object[".gogoproto.goproto_unkeyed_all"]);
                if (object[".cosmos_proto.declare_interface"]) {
                    if (!Array.isArray(object[".cosmos_proto.declare_interface"]))
                        throw TypeError(".google.protobuf.FileOptions..cosmos_proto.declare_interface: array expected");
                    message[".cosmos_proto.declare_interface"] = [];
                    for (let i = 0; i < object[".cosmos_proto.declare_interface"].length; ++i) {
                        if (typeof object[".cosmos_proto.declare_interface"][i] !== "object")
                            throw TypeError(".google.protobuf.FileOptions..cosmos_proto.declare_interface: object expected");
                        message[".cosmos_proto.declare_interface"][i] = $root.cosmos_proto.InterfaceDescriptor.fromObject(object[".cosmos_proto.declare_interface"][i]);
                    }
                }
                if (object[".cosmos_proto.declare_scalar"]) {
                    if (!Array.isArray(object[".cosmos_proto.declare_scalar"]))
                        throw TypeError(".google.protobuf.FileOptions..cosmos_proto.declare_scalar: array expected");
                    message[".cosmos_proto.declare_scalar"] = [];
                    for (let i = 0; i < object[".cosmos_proto.declare_scalar"].length; ++i) {
                        if (typeof object[".cosmos_proto.declare_scalar"][i] !== "object")
                            throw TypeError(".google.protobuf.FileOptions..cosmos_proto.declare_scalar: object expected");
                        message[".cosmos_proto.declare_scalar"][i] = $root.cosmos_proto.ScalarDescriptor.fromObject(object[".cosmos_proto.declare_scalar"][i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.FileOptions
             * @static
             * @param {google.protobuf.FileOptions} message FileOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FileOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.uninterpreted_option = [];
                    object[".cosmos_proto.declare_interface"] = [];
                    object[".cosmos_proto.declare_scalar"] = [];
                }
                if (options.defaults) {
                    object.java_package = "";
                    object.java_outer_classname = "";
                    object.optimize_for = options.enums === String ? "SPEED" : 1;
                    object.java_multiple_files = false;
                    object.go_package = "";
                    object.cc_generic_services = false;
                    object.java_generic_services = false;
                    object.py_generic_services = false;
                    object.java_generate_equals_and_hash = false;
                    object.deprecated = false;
                    object.java_string_check_utf8 = false;
                    object.cc_enable_arenas = false;
                    object.objc_class_prefix = "";
                    object.csharp_namespace = "";
                    object[".gogoproto.goproto_getters_all"] = false;
                    object[".gogoproto.goproto_enum_prefix_all"] = false;
                    object[".gogoproto.goproto_stringer_all"] = false;
                    object[".gogoproto.verbose_equal_all"] = false;
                    object[".gogoproto.face_all"] = false;
                    object[".gogoproto.gostring_all"] = false;
                    object[".gogoproto.populate_all"] = false;
                    object[".gogoproto.stringer_all"] = false;
                    object[".gogoproto.onlyone_all"] = false;
                    object[".gogoproto.equal_all"] = false;
                    object[".gogoproto.description_all"] = false;
                    object[".gogoproto.testgen_all"] = false;
                    object[".gogoproto.benchgen_all"] = false;
                    object[".gogoproto.marshaler_all"] = false;
                    object[".gogoproto.unmarshaler_all"] = false;
                    object[".gogoproto.stable_marshaler_all"] = false;
                    object[".gogoproto.sizer_all"] = false;
                    object[".gogoproto.goproto_enum_stringer_all"] = false;
                    object[".gogoproto.enum_stringer_all"] = false;
                    object[".gogoproto.unsafe_marshaler_all"] = false;
                    object[".gogoproto.unsafe_unmarshaler_all"] = false;
                    object[".gogoproto.goproto_extensions_map_all"] = false;
                    object[".gogoproto.goproto_unrecognized_all"] = false;
                    object[".gogoproto.gogoproto_import"] = false;
                    object[".gogoproto.protosizer_all"] = false;
                    object[".gogoproto.compare_all"] = false;
                    object[".gogoproto.typedecl_all"] = false;
                    object[".gogoproto.enumdecl_all"] = false;
                    object[".gogoproto.goproto_registration"] = false;
                    object[".gogoproto.messagename_all"] = false;
                    object[".gogoproto.goproto_sizecache_all"] = false;
                    object[".gogoproto.goproto_unkeyed_all"] = false;
                }
                if (message.java_package != null && message.hasOwnProperty("java_package"))
                    object.java_package = message.java_package;
                if (message.java_outer_classname != null && message.hasOwnProperty("java_outer_classname"))
                    object.java_outer_classname = message.java_outer_classname;
                if (message.optimize_for != null && message.hasOwnProperty("optimize_for"))
                    object.optimize_for = options.enums === String ? $root.google.protobuf.FileOptions.OptimizeMode[message.optimize_for] : message.optimize_for;
                if (message.java_multiple_files != null && message.hasOwnProperty("java_multiple_files"))
                    object.java_multiple_files = message.java_multiple_files;
                if (message.go_package != null && message.hasOwnProperty("go_package"))
                    object.go_package = message.go_package;
                if (message.cc_generic_services != null && message.hasOwnProperty("cc_generic_services"))
                    object.cc_generic_services = message.cc_generic_services;
                if (message.java_generic_services != null && message.hasOwnProperty("java_generic_services"))
                    object.java_generic_services = message.java_generic_services;
                if (message.py_generic_services != null && message.hasOwnProperty("py_generic_services"))
                    object.py_generic_services = message.py_generic_services;
                if (message.java_generate_equals_and_hash != null && message.hasOwnProperty("java_generate_equals_and_hash"))
                    object.java_generate_equals_and_hash = message.java_generate_equals_and_hash;
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.java_string_check_utf8 != null && message.hasOwnProperty("java_string_check_utf8"))
                    object.java_string_check_utf8 = message.java_string_check_utf8;
                if (message.cc_enable_arenas != null && message.hasOwnProperty("cc_enable_arenas"))
                    object.cc_enable_arenas = message.cc_enable_arenas;
                if (message.objc_class_prefix != null && message.hasOwnProperty("objc_class_prefix"))
                    object.objc_class_prefix = message.objc_class_prefix;
                if (message.csharp_namespace != null && message.hasOwnProperty("csharp_namespace"))
                    object.csharp_namespace = message.csharp_namespace;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".gogoproto.goproto_getters_all"] != null && message.hasOwnProperty(".gogoproto.goproto_getters_all"))
                    object[".gogoproto.goproto_getters_all"] = message[".gogoproto.goproto_getters_all"];
                if (message[".gogoproto.goproto_enum_prefix_all"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_prefix_all"))
                    object[".gogoproto.goproto_enum_prefix_all"] = message[".gogoproto.goproto_enum_prefix_all"];
                if (message[".gogoproto.goproto_stringer_all"] != null && message.hasOwnProperty(".gogoproto.goproto_stringer_all"))
                    object[".gogoproto.goproto_stringer_all"] = message[".gogoproto.goproto_stringer_all"];
                if (message[".gogoproto.verbose_equal_all"] != null && message.hasOwnProperty(".gogoproto.verbose_equal_all"))
                    object[".gogoproto.verbose_equal_all"] = message[".gogoproto.verbose_equal_all"];
                if (message[".gogoproto.face_all"] != null && message.hasOwnProperty(".gogoproto.face_all"))
                    object[".gogoproto.face_all"] = message[".gogoproto.face_all"];
                if (message[".gogoproto.gostring_all"] != null && message.hasOwnProperty(".gogoproto.gostring_all"))
                    object[".gogoproto.gostring_all"] = message[".gogoproto.gostring_all"];
                if (message[".gogoproto.populate_all"] != null && message.hasOwnProperty(".gogoproto.populate_all"))
                    object[".gogoproto.populate_all"] = message[".gogoproto.populate_all"];
                if (message[".gogoproto.stringer_all"] != null && message.hasOwnProperty(".gogoproto.stringer_all"))
                    object[".gogoproto.stringer_all"] = message[".gogoproto.stringer_all"];
                if (message[".gogoproto.onlyone_all"] != null && message.hasOwnProperty(".gogoproto.onlyone_all"))
                    object[".gogoproto.onlyone_all"] = message[".gogoproto.onlyone_all"];
                if (message[".gogoproto.equal_all"] != null && message.hasOwnProperty(".gogoproto.equal_all"))
                    object[".gogoproto.equal_all"] = message[".gogoproto.equal_all"];
                if (message[".gogoproto.description_all"] != null && message.hasOwnProperty(".gogoproto.description_all"))
                    object[".gogoproto.description_all"] = message[".gogoproto.description_all"];
                if (message[".gogoproto.testgen_all"] != null && message.hasOwnProperty(".gogoproto.testgen_all"))
                    object[".gogoproto.testgen_all"] = message[".gogoproto.testgen_all"];
                if (message[".gogoproto.benchgen_all"] != null && message.hasOwnProperty(".gogoproto.benchgen_all"))
                    object[".gogoproto.benchgen_all"] = message[".gogoproto.benchgen_all"];
                if (message[".gogoproto.marshaler_all"] != null && message.hasOwnProperty(".gogoproto.marshaler_all"))
                    object[".gogoproto.marshaler_all"] = message[".gogoproto.marshaler_all"];
                if (message[".gogoproto.unmarshaler_all"] != null && message.hasOwnProperty(".gogoproto.unmarshaler_all"))
                    object[".gogoproto.unmarshaler_all"] = message[".gogoproto.unmarshaler_all"];
                if (message[".gogoproto.stable_marshaler_all"] != null && message.hasOwnProperty(".gogoproto.stable_marshaler_all"))
                    object[".gogoproto.stable_marshaler_all"] = message[".gogoproto.stable_marshaler_all"];
                if (message[".gogoproto.sizer_all"] != null && message.hasOwnProperty(".gogoproto.sizer_all"))
                    object[".gogoproto.sizer_all"] = message[".gogoproto.sizer_all"];
                if (message[".gogoproto.goproto_enum_stringer_all"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_stringer_all"))
                    object[".gogoproto.goproto_enum_stringer_all"] = message[".gogoproto.goproto_enum_stringer_all"];
                if (message[".gogoproto.enum_stringer_all"] != null && message.hasOwnProperty(".gogoproto.enum_stringer_all"))
                    object[".gogoproto.enum_stringer_all"] = message[".gogoproto.enum_stringer_all"];
                if (message[".gogoproto.unsafe_marshaler_all"] != null && message.hasOwnProperty(".gogoproto.unsafe_marshaler_all"))
                    object[".gogoproto.unsafe_marshaler_all"] = message[".gogoproto.unsafe_marshaler_all"];
                if (message[".gogoproto.unsafe_unmarshaler_all"] != null && message.hasOwnProperty(".gogoproto.unsafe_unmarshaler_all"))
                    object[".gogoproto.unsafe_unmarshaler_all"] = message[".gogoproto.unsafe_unmarshaler_all"];
                if (message[".gogoproto.goproto_extensions_map_all"] != null && message.hasOwnProperty(".gogoproto.goproto_extensions_map_all"))
                    object[".gogoproto.goproto_extensions_map_all"] = message[".gogoproto.goproto_extensions_map_all"];
                if (message[".gogoproto.goproto_unrecognized_all"] != null && message.hasOwnProperty(".gogoproto.goproto_unrecognized_all"))
                    object[".gogoproto.goproto_unrecognized_all"] = message[".gogoproto.goproto_unrecognized_all"];
                if (message[".gogoproto.gogoproto_import"] != null && message.hasOwnProperty(".gogoproto.gogoproto_import"))
                    object[".gogoproto.gogoproto_import"] = message[".gogoproto.gogoproto_import"];
                if (message[".gogoproto.protosizer_all"] != null && message.hasOwnProperty(".gogoproto.protosizer_all"))
                    object[".gogoproto.protosizer_all"] = message[".gogoproto.protosizer_all"];
                if (message[".gogoproto.compare_all"] != null && message.hasOwnProperty(".gogoproto.compare_all"))
                    object[".gogoproto.compare_all"] = message[".gogoproto.compare_all"];
                if (message[".gogoproto.typedecl_all"] != null && message.hasOwnProperty(".gogoproto.typedecl_all"))
                    object[".gogoproto.typedecl_all"] = message[".gogoproto.typedecl_all"];
                if (message[".gogoproto.enumdecl_all"] != null && message.hasOwnProperty(".gogoproto.enumdecl_all"))
                    object[".gogoproto.enumdecl_all"] = message[".gogoproto.enumdecl_all"];
                if (message[".gogoproto.goproto_registration"] != null && message.hasOwnProperty(".gogoproto.goproto_registration"))
                    object[".gogoproto.goproto_registration"] = message[".gogoproto.goproto_registration"];
                if (message[".gogoproto.messagename_all"] != null && message.hasOwnProperty(".gogoproto.messagename_all"))
                    object[".gogoproto.messagename_all"] = message[".gogoproto.messagename_all"];
                if (message[".gogoproto.goproto_sizecache_all"] != null && message.hasOwnProperty(".gogoproto.goproto_sizecache_all"))
                    object[".gogoproto.goproto_sizecache_all"] = message[".gogoproto.goproto_sizecache_all"];
                if (message[".gogoproto.goproto_unkeyed_all"] != null && message.hasOwnProperty(".gogoproto.goproto_unkeyed_all"))
                    object[".gogoproto.goproto_unkeyed_all"] = message[".gogoproto.goproto_unkeyed_all"];
                if (message[".cosmos_proto.declare_interface"] && message[".cosmos_proto.declare_interface"].length) {
                    object[".cosmos_proto.declare_interface"] = [];
                    for (let j = 0; j < message[".cosmos_proto.declare_interface"].length; ++j)
                        object[".cosmos_proto.declare_interface"][j] = $root.cosmos_proto.InterfaceDescriptor.toObject(message[".cosmos_proto.declare_interface"][j], options);
                }
                if (message[".cosmos_proto.declare_scalar"] && message[".cosmos_proto.declare_scalar"].length) {
                    object[".cosmos_proto.declare_scalar"] = [];
                    for (let j = 0; j < message[".cosmos_proto.declare_scalar"].length; ++j)
                        object[".cosmos_proto.declare_scalar"][j] = $root.cosmos_proto.ScalarDescriptor.toObject(message[".cosmos_proto.declare_scalar"][j], options);
                }
                return object;
            };

            /**
             * Converts this FileOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.FileOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FileOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * OptimizeMode enum.
             * @name google.protobuf.FileOptions.OptimizeMode
             * @enum {number}
             * @property {number} SPEED=1 SPEED value
             * @property {number} CODE_SIZE=2 CODE_SIZE value
             * @property {number} LITE_RUNTIME=3 LITE_RUNTIME value
             */
            FileOptions.OptimizeMode = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[1] = "SPEED"] = 1;
                values[valuesById[2] = "CODE_SIZE"] = 2;
                values[valuesById[3] = "LITE_RUNTIME"] = 3;
                return values;
            })();

            return FileOptions;
        })();

        protobuf.MessageOptions = (function() {

            /**
             * Properties of a MessageOptions.
             * @memberof google.protobuf
             * @interface IMessageOptions
             * @property {boolean|null} [message_set_wire_format] MessageOptions message_set_wire_format
             * @property {boolean|null} [no_standard_descriptor_accessor] MessageOptions no_standard_descriptor_accessor
             * @property {boolean|null} [deprecated] MessageOptions deprecated
             * @property {boolean|null} [map_entry] MessageOptions map_entry
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] MessageOptions uninterpreted_option
             * @property {boolean|null} [".gogoproto.goproto_getters"] MessageOptions .gogoproto.goproto_getters
             * @property {boolean|null} [".gogoproto.goproto_stringer"] MessageOptions .gogoproto.goproto_stringer
             * @property {boolean|null} [".gogoproto.verbose_equal"] MessageOptions .gogoproto.verbose_equal
             * @property {boolean|null} [".gogoproto.face"] MessageOptions .gogoproto.face
             * @property {boolean|null} [".gogoproto.gostring"] MessageOptions .gogoproto.gostring
             * @property {boolean|null} [".gogoproto.populate"] MessageOptions .gogoproto.populate
             * @property {boolean|null} [".gogoproto.stringer"] MessageOptions .gogoproto.stringer
             * @property {boolean|null} [".gogoproto.onlyone"] MessageOptions .gogoproto.onlyone
             * @property {boolean|null} [".gogoproto.equal"] MessageOptions .gogoproto.equal
             * @property {boolean|null} [".gogoproto.description"] MessageOptions .gogoproto.description
             * @property {boolean|null} [".gogoproto.testgen"] MessageOptions .gogoproto.testgen
             * @property {boolean|null} [".gogoproto.benchgen"] MessageOptions .gogoproto.benchgen
             * @property {boolean|null} [".gogoproto.marshaler"] MessageOptions .gogoproto.marshaler
             * @property {boolean|null} [".gogoproto.unmarshaler"] MessageOptions .gogoproto.unmarshaler
             * @property {boolean|null} [".gogoproto.stable_marshaler"] MessageOptions .gogoproto.stable_marshaler
             * @property {boolean|null} [".gogoproto.sizer"] MessageOptions .gogoproto.sizer
             * @property {boolean|null} [".gogoproto.unsafe_marshaler"] MessageOptions .gogoproto.unsafe_marshaler
             * @property {boolean|null} [".gogoproto.unsafe_unmarshaler"] MessageOptions .gogoproto.unsafe_unmarshaler
             * @property {boolean|null} [".gogoproto.goproto_extensions_map"] MessageOptions .gogoproto.goproto_extensions_map
             * @property {boolean|null} [".gogoproto.goproto_unrecognized"] MessageOptions .gogoproto.goproto_unrecognized
             * @property {boolean|null} [".gogoproto.protosizer"] MessageOptions .gogoproto.protosizer
             * @property {boolean|null} [".gogoproto.compare"] MessageOptions .gogoproto.compare
             * @property {boolean|null} [".gogoproto.typedecl"] MessageOptions .gogoproto.typedecl
             * @property {boolean|null} [".gogoproto.messagename"] MessageOptions .gogoproto.messagename
             * @property {boolean|null} [".gogoproto.goproto_sizecache"] MessageOptions .gogoproto.goproto_sizecache
             * @property {boolean|null} [".gogoproto.goproto_unkeyed"] MessageOptions .gogoproto.goproto_unkeyed
             * @property {Array.<string>|null} [".cosmos_proto.implements_interface"] MessageOptions .cosmos_proto.implements_interface
             */

            /**
             * Constructs a new MessageOptions.
             * @memberof google.protobuf
             * @classdesc Represents a MessageOptions.
             * @implements IMessageOptions
             * @constructor
             * @param {google.protobuf.IMessageOptions=} [properties] Properties to set
             */
            function MessageOptions(properties) {
                this.uninterpreted_option = [];
                this[".cosmos_proto.implements_interface"] = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessageOptions message_set_wire_format.
             * @member {boolean} message_set_wire_format
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype.message_set_wire_format = false;

            /**
             * MessageOptions no_standard_descriptor_accessor.
             * @member {boolean} no_standard_descriptor_accessor
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype.no_standard_descriptor_accessor = false;

            /**
             * MessageOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype.deprecated = false;

            /**
             * MessageOptions map_entry.
             * @member {boolean} map_entry
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype.map_entry = false;

            /**
             * MessageOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * MessageOptions .gogoproto.goproto_getters.
             * @member {boolean} .gogoproto.goproto_getters
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_getters"] = false;

            /**
             * MessageOptions .gogoproto.goproto_stringer.
             * @member {boolean} .gogoproto.goproto_stringer
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_stringer"] = false;

            /**
             * MessageOptions .gogoproto.verbose_equal.
             * @member {boolean} .gogoproto.verbose_equal
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.verbose_equal"] = false;

            /**
             * MessageOptions .gogoproto.face.
             * @member {boolean} .gogoproto.face
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.face"] = false;

            /**
             * MessageOptions .gogoproto.gostring.
             * @member {boolean} .gogoproto.gostring
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.gostring"] = false;

            /**
             * MessageOptions .gogoproto.populate.
             * @member {boolean} .gogoproto.populate
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.populate"] = false;

            /**
             * MessageOptions .gogoproto.stringer.
             * @member {boolean} .gogoproto.stringer
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.stringer"] = false;

            /**
             * MessageOptions .gogoproto.onlyone.
             * @member {boolean} .gogoproto.onlyone
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.onlyone"] = false;

            /**
             * MessageOptions .gogoproto.equal.
             * @member {boolean} .gogoproto.equal
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.equal"] = false;

            /**
             * MessageOptions .gogoproto.description.
             * @member {boolean} .gogoproto.description
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.description"] = false;

            /**
             * MessageOptions .gogoproto.testgen.
             * @member {boolean} .gogoproto.testgen
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.testgen"] = false;

            /**
             * MessageOptions .gogoproto.benchgen.
             * @member {boolean} .gogoproto.benchgen
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.benchgen"] = false;

            /**
             * MessageOptions .gogoproto.marshaler.
             * @member {boolean} .gogoproto.marshaler
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.marshaler"] = false;

            /**
             * MessageOptions .gogoproto.unmarshaler.
             * @member {boolean} .gogoproto.unmarshaler
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.unmarshaler"] = false;

            /**
             * MessageOptions .gogoproto.stable_marshaler.
             * @member {boolean} .gogoproto.stable_marshaler
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.stable_marshaler"] = false;

            /**
             * MessageOptions .gogoproto.sizer.
             * @member {boolean} .gogoproto.sizer
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.sizer"] = false;

            /**
             * MessageOptions .gogoproto.unsafe_marshaler.
             * @member {boolean} .gogoproto.unsafe_marshaler
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.unsafe_marshaler"] = false;

            /**
             * MessageOptions .gogoproto.unsafe_unmarshaler.
             * @member {boolean} .gogoproto.unsafe_unmarshaler
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.unsafe_unmarshaler"] = false;

            /**
             * MessageOptions .gogoproto.goproto_extensions_map.
             * @member {boolean} .gogoproto.goproto_extensions_map
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_extensions_map"] = false;

            /**
             * MessageOptions .gogoproto.goproto_unrecognized.
             * @member {boolean} .gogoproto.goproto_unrecognized
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_unrecognized"] = false;

            /**
             * MessageOptions .gogoproto.protosizer.
             * @member {boolean} .gogoproto.protosizer
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.protosizer"] = false;

            /**
             * MessageOptions .gogoproto.compare.
             * @member {boolean} .gogoproto.compare
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.compare"] = false;

            /**
             * MessageOptions .gogoproto.typedecl.
             * @member {boolean} .gogoproto.typedecl
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.typedecl"] = false;

            /**
             * MessageOptions .gogoproto.messagename.
             * @member {boolean} .gogoproto.messagename
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.messagename"] = false;

            /**
             * MessageOptions .gogoproto.goproto_sizecache.
             * @member {boolean} .gogoproto.goproto_sizecache
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_sizecache"] = false;

            /**
             * MessageOptions .gogoproto.goproto_unkeyed.
             * @member {boolean} .gogoproto.goproto_unkeyed
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".gogoproto.goproto_unkeyed"] = false;

            /**
             * MessageOptions .cosmos_proto.implements_interface.
             * @member {Array.<string>} .cosmos_proto.implements_interface
             * @memberof google.protobuf.MessageOptions
             * @instance
             */
            MessageOptions.prototype[".cosmos_proto.implements_interface"] = $util.emptyArray;

            /**
             * Encodes the specified MessageOptions message. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {google.protobuf.IMessageOptions} message MessageOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.message_set_wire_format != null && Object.hasOwnProperty.call(message, "message_set_wire_format"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.message_set_wire_format);
                if (message.no_standard_descriptor_accessor != null && Object.hasOwnProperty.call(message, "no_standard_descriptor_accessor"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.no_standard_descriptor_accessor);
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.deprecated);
                if (message.map_entry != null && Object.hasOwnProperty.call(message, "map_entry"))
                    writer.uint32(/* id 7, wireType 0 =*/56).bool(message.map_entry);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".gogoproto.goproto_getters"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_getters"))
                    writer.uint32(/* id 64001, wireType 0 =*/512008).bool(message[".gogoproto.goproto_getters"]);
                if (message[".gogoproto.goproto_stringer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_stringer"))
                    writer.uint32(/* id 64003, wireType 0 =*/512024).bool(message[".gogoproto.goproto_stringer"]);
                if (message[".gogoproto.verbose_equal"] != null && Object.hasOwnProperty.call(message, ".gogoproto.verbose_equal"))
                    writer.uint32(/* id 64004, wireType 0 =*/512032).bool(message[".gogoproto.verbose_equal"]);
                if (message[".gogoproto.face"] != null && Object.hasOwnProperty.call(message, ".gogoproto.face"))
                    writer.uint32(/* id 64005, wireType 0 =*/512040).bool(message[".gogoproto.face"]);
                if (message[".gogoproto.gostring"] != null && Object.hasOwnProperty.call(message, ".gogoproto.gostring"))
                    writer.uint32(/* id 64006, wireType 0 =*/512048).bool(message[".gogoproto.gostring"]);
                if (message[".gogoproto.populate"] != null && Object.hasOwnProperty.call(message, ".gogoproto.populate"))
                    writer.uint32(/* id 64007, wireType 0 =*/512056).bool(message[".gogoproto.populate"]);
                if (message[".gogoproto.onlyone"] != null && Object.hasOwnProperty.call(message, ".gogoproto.onlyone"))
                    writer.uint32(/* id 64009, wireType 0 =*/512072).bool(message[".gogoproto.onlyone"]);
                if (message[".gogoproto.equal"] != null && Object.hasOwnProperty.call(message, ".gogoproto.equal"))
                    writer.uint32(/* id 64013, wireType 0 =*/512104).bool(message[".gogoproto.equal"]);
                if (message[".gogoproto.description"] != null && Object.hasOwnProperty.call(message, ".gogoproto.description"))
                    writer.uint32(/* id 64014, wireType 0 =*/512112).bool(message[".gogoproto.description"]);
                if (message[".gogoproto.testgen"] != null && Object.hasOwnProperty.call(message, ".gogoproto.testgen"))
                    writer.uint32(/* id 64015, wireType 0 =*/512120).bool(message[".gogoproto.testgen"]);
                if (message[".gogoproto.benchgen"] != null && Object.hasOwnProperty.call(message, ".gogoproto.benchgen"))
                    writer.uint32(/* id 64016, wireType 0 =*/512128).bool(message[".gogoproto.benchgen"]);
                if (message[".gogoproto.marshaler"] != null && Object.hasOwnProperty.call(message, ".gogoproto.marshaler"))
                    writer.uint32(/* id 64017, wireType 0 =*/512136).bool(message[".gogoproto.marshaler"]);
                if (message[".gogoproto.unmarshaler"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unmarshaler"))
                    writer.uint32(/* id 64018, wireType 0 =*/512144).bool(message[".gogoproto.unmarshaler"]);
                if (message[".gogoproto.stable_marshaler"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stable_marshaler"))
                    writer.uint32(/* id 64019, wireType 0 =*/512152).bool(message[".gogoproto.stable_marshaler"]);
                if (message[".gogoproto.sizer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.sizer"))
                    writer.uint32(/* id 64020, wireType 0 =*/512160).bool(message[".gogoproto.sizer"]);
                if (message[".gogoproto.unsafe_marshaler"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unsafe_marshaler"))
                    writer.uint32(/* id 64023, wireType 0 =*/512184).bool(message[".gogoproto.unsafe_marshaler"]);
                if (message[".gogoproto.unsafe_unmarshaler"] != null && Object.hasOwnProperty.call(message, ".gogoproto.unsafe_unmarshaler"))
                    writer.uint32(/* id 64024, wireType 0 =*/512192).bool(message[".gogoproto.unsafe_unmarshaler"]);
                if (message[".gogoproto.goproto_extensions_map"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_extensions_map"))
                    writer.uint32(/* id 64025, wireType 0 =*/512200).bool(message[".gogoproto.goproto_extensions_map"]);
                if (message[".gogoproto.goproto_unrecognized"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_unrecognized"))
                    writer.uint32(/* id 64026, wireType 0 =*/512208).bool(message[".gogoproto.goproto_unrecognized"]);
                if (message[".gogoproto.protosizer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.protosizer"))
                    writer.uint32(/* id 64028, wireType 0 =*/512224).bool(message[".gogoproto.protosizer"]);
                if (message[".gogoproto.compare"] != null && Object.hasOwnProperty.call(message, ".gogoproto.compare"))
                    writer.uint32(/* id 64029, wireType 0 =*/512232).bool(message[".gogoproto.compare"]);
                if (message[".gogoproto.typedecl"] != null && Object.hasOwnProperty.call(message, ".gogoproto.typedecl"))
                    writer.uint32(/* id 64030, wireType 0 =*/512240).bool(message[".gogoproto.typedecl"]);
                if (message[".gogoproto.messagename"] != null && Object.hasOwnProperty.call(message, ".gogoproto.messagename"))
                    writer.uint32(/* id 64033, wireType 0 =*/512264).bool(message[".gogoproto.messagename"]);
                if (message[".gogoproto.goproto_sizecache"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_sizecache"))
                    writer.uint32(/* id 64034, wireType 0 =*/512272).bool(message[".gogoproto.goproto_sizecache"]);
                if (message[".gogoproto.goproto_unkeyed"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_unkeyed"))
                    writer.uint32(/* id 64035, wireType 0 =*/512280).bool(message[".gogoproto.goproto_unkeyed"]);
                if (message[".gogoproto.stringer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stringer"))
                    writer.uint32(/* id 67008, wireType 0 =*/536064).bool(message[".gogoproto.stringer"]);
                if (message[".cosmos_proto.implements_interface"] != null && message[".cosmos_proto.implements_interface"].length)
                    for (let i = 0; i < message[".cosmos_proto.implements_interface"].length; ++i)
                        writer.uint32(/* id 93001, wireType 2 =*/744010).string(message[".cosmos_proto.implements_interface"][i]);
                return writer;
            };

            /**
             * Encodes the specified MessageOptions message, length delimited. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {google.protobuf.IMessageOptions} message MessageOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MessageOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.MessageOptions} MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.MessageOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.message_set_wire_format = reader.bool();
                        break;
                    case 2:
                        message.no_standard_descriptor_accessor = reader.bool();
                        break;
                    case 3:
                        message.deprecated = reader.bool();
                        break;
                    case 7:
                        message.map_entry = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 64001:
                        message[".gogoproto.goproto_getters"] = reader.bool();
                        break;
                    case 64003:
                        message[".gogoproto.goproto_stringer"] = reader.bool();
                        break;
                    case 64004:
                        message[".gogoproto.verbose_equal"] = reader.bool();
                        break;
                    case 64005:
                        message[".gogoproto.face"] = reader.bool();
                        break;
                    case 64006:
                        message[".gogoproto.gostring"] = reader.bool();
                        break;
                    case 64007:
                        message[".gogoproto.populate"] = reader.bool();
                        break;
                    case 67008:
                        message[".gogoproto.stringer"] = reader.bool();
                        break;
                    case 64009:
                        message[".gogoproto.onlyone"] = reader.bool();
                        break;
                    case 64013:
                        message[".gogoproto.equal"] = reader.bool();
                        break;
                    case 64014:
                        message[".gogoproto.description"] = reader.bool();
                        break;
                    case 64015:
                        message[".gogoproto.testgen"] = reader.bool();
                        break;
                    case 64016:
                        message[".gogoproto.benchgen"] = reader.bool();
                        break;
                    case 64017:
                        message[".gogoproto.marshaler"] = reader.bool();
                        break;
                    case 64018:
                        message[".gogoproto.unmarshaler"] = reader.bool();
                        break;
                    case 64019:
                        message[".gogoproto.stable_marshaler"] = reader.bool();
                        break;
                    case 64020:
                        message[".gogoproto.sizer"] = reader.bool();
                        break;
                    case 64023:
                        message[".gogoproto.unsafe_marshaler"] = reader.bool();
                        break;
                    case 64024:
                        message[".gogoproto.unsafe_unmarshaler"] = reader.bool();
                        break;
                    case 64025:
                        message[".gogoproto.goproto_extensions_map"] = reader.bool();
                        break;
                    case 64026:
                        message[".gogoproto.goproto_unrecognized"] = reader.bool();
                        break;
                    case 64028:
                        message[".gogoproto.protosizer"] = reader.bool();
                        break;
                    case 64029:
                        message[".gogoproto.compare"] = reader.bool();
                        break;
                    case 64030:
                        message[".gogoproto.typedecl"] = reader.bool();
                        break;
                    case 64033:
                        message[".gogoproto.messagename"] = reader.bool();
                        break;
                    case 64034:
                        message[".gogoproto.goproto_sizecache"] = reader.bool();
                        break;
                    case 64035:
                        message[".gogoproto.goproto_unkeyed"] = reader.bool();
                        break;
                    case 93001:
                        if (!(message[".cosmos_proto.implements_interface"] && message[".cosmos_proto.implements_interface"].length))
                            message[".cosmos_proto.implements_interface"] = [];
                        message[".cosmos_proto.implements_interface"].push(reader.string());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MessageOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.MessageOptions} MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessageOptions message.
             * @function verify
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessageOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.message_set_wire_format != null && message.hasOwnProperty("message_set_wire_format"))
                    if (typeof message.message_set_wire_format !== "boolean")
                        return "message_set_wire_format: boolean expected";
                if (message.no_standard_descriptor_accessor != null && message.hasOwnProperty("no_standard_descriptor_accessor"))
                    if (typeof message.no_standard_descriptor_accessor !== "boolean")
                        return "no_standard_descriptor_accessor: boolean expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.map_entry != null && message.hasOwnProperty("map_entry"))
                    if (typeof message.map_entry !== "boolean")
                        return "map_entry: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".gogoproto.goproto_getters"] != null && message.hasOwnProperty(".gogoproto.goproto_getters"))
                    if (typeof message[".gogoproto.goproto_getters"] !== "boolean")
                        return ".gogoproto.goproto_getters: boolean expected";
                if (message[".gogoproto.goproto_stringer"] != null && message.hasOwnProperty(".gogoproto.goproto_stringer"))
                    if (typeof message[".gogoproto.goproto_stringer"] !== "boolean")
                        return ".gogoproto.goproto_stringer: boolean expected";
                if (message[".gogoproto.verbose_equal"] != null && message.hasOwnProperty(".gogoproto.verbose_equal"))
                    if (typeof message[".gogoproto.verbose_equal"] !== "boolean")
                        return ".gogoproto.verbose_equal: boolean expected";
                if (message[".gogoproto.face"] != null && message.hasOwnProperty(".gogoproto.face"))
                    if (typeof message[".gogoproto.face"] !== "boolean")
                        return ".gogoproto.face: boolean expected";
                if (message[".gogoproto.gostring"] != null && message.hasOwnProperty(".gogoproto.gostring"))
                    if (typeof message[".gogoproto.gostring"] !== "boolean")
                        return ".gogoproto.gostring: boolean expected";
                if (message[".gogoproto.populate"] != null && message.hasOwnProperty(".gogoproto.populate"))
                    if (typeof message[".gogoproto.populate"] !== "boolean")
                        return ".gogoproto.populate: boolean expected";
                if (message[".gogoproto.stringer"] != null && message.hasOwnProperty(".gogoproto.stringer"))
                    if (typeof message[".gogoproto.stringer"] !== "boolean")
                        return ".gogoproto.stringer: boolean expected";
                if (message[".gogoproto.onlyone"] != null && message.hasOwnProperty(".gogoproto.onlyone"))
                    if (typeof message[".gogoproto.onlyone"] !== "boolean")
                        return ".gogoproto.onlyone: boolean expected";
                if (message[".gogoproto.equal"] != null && message.hasOwnProperty(".gogoproto.equal"))
                    if (typeof message[".gogoproto.equal"] !== "boolean")
                        return ".gogoproto.equal: boolean expected";
                if (message[".gogoproto.description"] != null && message.hasOwnProperty(".gogoproto.description"))
                    if (typeof message[".gogoproto.description"] !== "boolean")
                        return ".gogoproto.description: boolean expected";
                if (message[".gogoproto.testgen"] != null && message.hasOwnProperty(".gogoproto.testgen"))
                    if (typeof message[".gogoproto.testgen"] !== "boolean")
                        return ".gogoproto.testgen: boolean expected";
                if (message[".gogoproto.benchgen"] != null && message.hasOwnProperty(".gogoproto.benchgen"))
                    if (typeof message[".gogoproto.benchgen"] !== "boolean")
                        return ".gogoproto.benchgen: boolean expected";
                if (message[".gogoproto.marshaler"] != null && message.hasOwnProperty(".gogoproto.marshaler"))
                    if (typeof message[".gogoproto.marshaler"] !== "boolean")
                        return ".gogoproto.marshaler: boolean expected";
                if (message[".gogoproto.unmarshaler"] != null && message.hasOwnProperty(".gogoproto.unmarshaler"))
                    if (typeof message[".gogoproto.unmarshaler"] !== "boolean")
                        return ".gogoproto.unmarshaler: boolean expected";
                if (message[".gogoproto.stable_marshaler"] != null && message.hasOwnProperty(".gogoproto.stable_marshaler"))
                    if (typeof message[".gogoproto.stable_marshaler"] !== "boolean")
                        return ".gogoproto.stable_marshaler: boolean expected";
                if (message[".gogoproto.sizer"] != null && message.hasOwnProperty(".gogoproto.sizer"))
                    if (typeof message[".gogoproto.sizer"] !== "boolean")
                        return ".gogoproto.sizer: boolean expected";
                if (message[".gogoproto.unsafe_marshaler"] != null && message.hasOwnProperty(".gogoproto.unsafe_marshaler"))
                    if (typeof message[".gogoproto.unsafe_marshaler"] !== "boolean")
                        return ".gogoproto.unsafe_marshaler: boolean expected";
                if (message[".gogoproto.unsafe_unmarshaler"] != null && message.hasOwnProperty(".gogoproto.unsafe_unmarshaler"))
                    if (typeof message[".gogoproto.unsafe_unmarshaler"] !== "boolean")
                        return ".gogoproto.unsafe_unmarshaler: boolean expected";
                if (message[".gogoproto.goproto_extensions_map"] != null && message.hasOwnProperty(".gogoproto.goproto_extensions_map"))
                    if (typeof message[".gogoproto.goproto_extensions_map"] !== "boolean")
                        return ".gogoproto.goproto_extensions_map: boolean expected";
                if (message[".gogoproto.goproto_unrecognized"] != null && message.hasOwnProperty(".gogoproto.goproto_unrecognized"))
                    if (typeof message[".gogoproto.goproto_unrecognized"] !== "boolean")
                        return ".gogoproto.goproto_unrecognized: boolean expected";
                if (message[".gogoproto.protosizer"] != null && message.hasOwnProperty(".gogoproto.protosizer"))
                    if (typeof message[".gogoproto.protosizer"] !== "boolean")
                        return ".gogoproto.protosizer: boolean expected";
                if (message[".gogoproto.compare"] != null && message.hasOwnProperty(".gogoproto.compare"))
                    if (typeof message[".gogoproto.compare"] !== "boolean")
                        return ".gogoproto.compare: boolean expected";
                if (message[".gogoproto.typedecl"] != null && message.hasOwnProperty(".gogoproto.typedecl"))
                    if (typeof message[".gogoproto.typedecl"] !== "boolean")
                        return ".gogoproto.typedecl: boolean expected";
                if (message[".gogoproto.messagename"] != null && message.hasOwnProperty(".gogoproto.messagename"))
                    if (typeof message[".gogoproto.messagename"] !== "boolean")
                        return ".gogoproto.messagename: boolean expected";
                if (message[".gogoproto.goproto_sizecache"] != null && message.hasOwnProperty(".gogoproto.goproto_sizecache"))
                    if (typeof message[".gogoproto.goproto_sizecache"] !== "boolean")
                        return ".gogoproto.goproto_sizecache: boolean expected";
                if (message[".gogoproto.goproto_unkeyed"] != null && message.hasOwnProperty(".gogoproto.goproto_unkeyed"))
                    if (typeof message[".gogoproto.goproto_unkeyed"] !== "boolean")
                        return ".gogoproto.goproto_unkeyed: boolean expected";
                if (message[".cosmos_proto.implements_interface"] != null && message.hasOwnProperty(".cosmos_proto.implements_interface")) {
                    if (!Array.isArray(message[".cosmos_proto.implements_interface"]))
                        return ".cosmos_proto.implements_interface: array expected";
                    for (let i = 0; i < message[".cosmos_proto.implements_interface"].length; ++i)
                        if (!$util.isString(message[".cosmos_proto.implements_interface"][i]))
                            return ".cosmos_proto.implements_interface: string[] expected";
                }
                return null;
            };

            /**
             * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.MessageOptions} MessageOptions
             */
            MessageOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.MessageOptions)
                    return object;
                let message = new $root.google.protobuf.MessageOptions();
                if (object.message_set_wire_format != null)
                    message.message_set_wire_format = Boolean(object.message_set_wire_format);
                if (object.no_standard_descriptor_accessor != null)
                    message.no_standard_descriptor_accessor = Boolean(object.no_standard_descriptor_accessor);
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.map_entry != null)
                    message.map_entry = Boolean(object.map_entry);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.MessageOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.MessageOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".gogoproto.goproto_getters"] != null)
                    message[".gogoproto.goproto_getters"] = Boolean(object[".gogoproto.goproto_getters"]);
                if (object[".gogoproto.goproto_stringer"] != null)
                    message[".gogoproto.goproto_stringer"] = Boolean(object[".gogoproto.goproto_stringer"]);
                if (object[".gogoproto.verbose_equal"] != null)
                    message[".gogoproto.verbose_equal"] = Boolean(object[".gogoproto.verbose_equal"]);
                if (object[".gogoproto.face"] != null)
                    message[".gogoproto.face"] = Boolean(object[".gogoproto.face"]);
                if (object[".gogoproto.gostring"] != null)
                    message[".gogoproto.gostring"] = Boolean(object[".gogoproto.gostring"]);
                if (object[".gogoproto.populate"] != null)
                    message[".gogoproto.populate"] = Boolean(object[".gogoproto.populate"]);
                if (object[".gogoproto.stringer"] != null)
                    message[".gogoproto.stringer"] = Boolean(object[".gogoproto.stringer"]);
                if (object[".gogoproto.onlyone"] != null)
                    message[".gogoproto.onlyone"] = Boolean(object[".gogoproto.onlyone"]);
                if (object[".gogoproto.equal"] != null)
                    message[".gogoproto.equal"] = Boolean(object[".gogoproto.equal"]);
                if (object[".gogoproto.description"] != null)
                    message[".gogoproto.description"] = Boolean(object[".gogoproto.description"]);
                if (object[".gogoproto.testgen"] != null)
                    message[".gogoproto.testgen"] = Boolean(object[".gogoproto.testgen"]);
                if (object[".gogoproto.benchgen"] != null)
                    message[".gogoproto.benchgen"] = Boolean(object[".gogoproto.benchgen"]);
                if (object[".gogoproto.marshaler"] != null)
                    message[".gogoproto.marshaler"] = Boolean(object[".gogoproto.marshaler"]);
                if (object[".gogoproto.unmarshaler"] != null)
                    message[".gogoproto.unmarshaler"] = Boolean(object[".gogoproto.unmarshaler"]);
                if (object[".gogoproto.stable_marshaler"] != null)
                    message[".gogoproto.stable_marshaler"] = Boolean(object[".gogoproto.stable_marshaler"]);
                if (object[".gogoproto.sizer"] != null)
                    message[".gogoproto.sizer"] = Boolean(object[".gogoproto.sizer"]);
                if (object[".gogoproto.unsafe_marshaler"] != null)
                    message[".gogoproto.unsafe_marshaler"] = Boolean(object[".gogoproto.unsafe_marshaler"]);
                if (object[".gogoproto.unsafe_unmarshaler"] != null)
                    message[".gogoproto.unsafe_unmarshaler"] = Boolean(object[".gogoproto.unsafe_unmarshaler"]);
                if (object[".gogoproto.goproto_extensions_map"] != null)
                    message[".gogoproto.goproto_extensions_map"] = Boolean(object[".gogoproto.goproto_extensions_map"]);
                if (object[".gogoproto.goproto_unrecognized"] != null)
                    message[".gogoproto.goproto_unrecognized"] = Boolean(object[".gogoproto.goproto_unrecognized"]);
                if (object[".gogoproto.protosizer"] != null)
                    message[".gogoproto.protosizer"] = Boolean(object[".gogoproto.protosizer"]);
                if (object[".gogoproto.compare"] != null)
                    message[".gogoproto.compare"] = Boolean(object[".gogoproto.compare"]);
                if (object[".gogoproto.typedecl"] != null)
                    message[".gogoproto.typedecl"] = Boolean(object[".gogoproto.typedecl"]);
                if (object[".gogoproto.messagename"] != null)
                    message[".gogoproto.messagename"] = Boolean(object[".gogoproto.messagename"]);
                if (object[".gogoproto.goproto_sizecache"] != null)
                    message[".gogoproto.goproto_sizecache"] = Boolean(object[".gogoproto.goproto_sizecache"]);
                if (object[".gogoproto.goproto_unkeyed"] != null)
                    message[".gogoproto.goproto_unkeyed"] = Boolean(object[".gogoproto.goproto_unkeyed"]);
                if (object[".cosmos_proto.implements_interface"]) {
                    if (!Array.isArray(object[".cosmos_proto.implements_interface"]))
                        throw TypeError(".google.protobuf.MessageOptions..cosmos_proto.implements_interface: array expected");
                    message[".cosmos_proto.implements_interface"] = [];
                    for (let i = 0; i < object[".cosmos_proto.implements_interface"].length; ++i)
                        message[".cosmos_proto.implements_interface"][i] = String(object[".cosmos_proto.implements_interface"][i]);
                }
                return message;
            };

            /**
             * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.MessageOptions
             * @static
             * @param {google.protobuf.MessageOptions} message MessageOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessageOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults) {
                    object.uninterpreted_option = [];
                    object[".cosmos_proto.implements_interface"] = [];
                }
                if (options.defaults) {
                    object.message_set_wire_format = false;
                    object.no_standard_descriptor_accessor = false;
                    object.deprecated = false;
                    object.map_entry = false;
                    object[".gogoproto.goproto_getters"] = false;
                    object[".gogoproto.goproto_stringer"] = false;
                    object[".gogoproto.verbose_equal"] = false;
                    object[".gogoproto.face"] = false;
                    object[".gogoproto.gostring"] = false;
                    object[".gogoproto.populate"] = false;
                    object[".gogoproto.onlyone"] = false;
                    object[".gogoproto.equal"] = false;
                    object[".gogoproto.description"] = false;
                    object[".gogoproto.testgen"] = false;
                    object[".gogoproto.benchgen"] = false;
                    object[".gogoproto.marshaler"] = false;
                    object[".gogoproto.unmarshaler"] = false;
                    object[".gogoproto.stable_marshaler"] = false;
                    object[".gogoproto.sizer"] = false;
                    object[".gogoproto.unsafe_marshaler"] = false;
                    object[".gogoproto.unsafe_unmarshaler"] = false;
                    object[".gogoproto.goproto_extensions_map"] = false;
                    object[".gogoproto.goproto_unrecognized"] = false;
                    object[".gogoproto.protosizer"] = false;
                    object[".gogoproto.compare"] = false;
                    object[".gogoproto.typedecl"] = false;
                    object[".gogoproto.messagename"] = false;
                    object[".gogoproto.goproto_sizecache"] = false;
                    object[".gogoproto.goproto_unkeyed"] = false;
                    object[".gogoproto.stringer"] = false;
                }
                if (message.message_set_wire_format != null && message.hasOwnProperty("message_set_wire_format"))
                    object.message_set_wire_format = message.message_set_wire_format;
                if (message.no_standard_descriptor_accessor != null && message.hasOwnProperty("no_standard_descriptor_accessor"))
                    object.no_standard_descriptor_accessor = message.no_standard_descriptor_accessor;
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.map_entry != null && message.hasOwnProperty("map_entry"))
                    object.map_entry = message.map_entry;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".gogoproto.goproto_getters"] != null && message.hasOwnProperty(".gogoproto.goproto_getters"))
                    object[".gogoproto.goproto_getters"] = message[".gogoproto.goproto_getters"];
                if (message[".gogoproto.goproto_stringer"] != null && message.hasOwnProperty(".gogoproto.goproto_stringer"))
                    object[".gogoproto.goproto_stringer"] = message[".gogoproto.goproto_stringer"];
                if (message[".gogoproto.verbose_equal"] != null && message.hasOwnProperty(".gogoproto.verbose_equal"))
                    object[".gogoproto.verbose_equal"] = message[".gogoproto.verbose_equal"];
                if (message[".gogoproto.face"] != null && message.hasOwnProperty(".gogoproto.face"))
                    object[".gogoproto.face"] = message[".gogoproto.face"];
                if (message[".gogoproto.gostring"] != null && message.hasOwnProperty(".gogoproto.gostring"))
                    object[".gogoproto.gostring"] = message[".gogoproto.gostring"];
                if (message[".gogoproto.populate"] != null && message.hasOwnProperty(".gogoproto.populate"))
                    object[".gogoproto.populate"] = message[".gogoproto.populate"];
                if (message[".gogoproto.onlyone"] != null && message.hasOwnProperty(".gogoproto.onlyone"))
                    object[".gogoproto.onlyone"] = message[".gogoproto.onlyone"];
                if (message[".gogoproto.equal"] != null && message.hasOwnProperty(".gogoproto.equal"))
                    object[".gogoproto.equal"] = message[".gogoproto.equal"];
                if (message[".gogoproto.description"] != null && message.hasOwnProperty(".gogoproto.description"))
                    object[".gogoproto.description"] = message[".gogoproto.description"];
                if (message[".gogoproto.testgen"] != null && message.hasOwnProperty(".gogoproto.testgen"))
                    object[".gogoproto.testgen"] = message[".gogoproto.testgen"];
                if (message[".gogoproto.benchgen"] != null && message.hasOwnProperty(".gogoproto.benchgen"))
                    object[".gogoproto.benchgen"] = message[".gogoproto.benchgen"];
                if (message[".gogoproto.marshaler"] != null && message.hasOwnProperty(".gogoproto.marshaler"))
                    object[".gogoproto.marshaler"] = message[".gogoproto.marshaler"];
                if (message[".gogoproto.unmarshaler"] != null && message.hasOwnProperty(".gogoproto.unmarshaler"))
                    object[".gogoproto.unmarshaler"] = message[".gogoproto.unmarshaler"];
                if (message[".gogoproto.stable_marshaler"] != null && message.hasOwnProperty(".gogoproto.stable_marshaler"))
                    object[".gogoproto.stable_marshaler"] = message[".gogoproto.stable_marshaler"];
                if (message[".gogoproto.sizer"] != null && message.hasOwnProperty(".gogoproto.sizer"))
                    object[".gogoproto.sizer"] = message[".gogoproto.sizer"];
                if (message[".gogoproto.unsafe_marshaler"] != null && message.hasOwnProperty(".gogoproto.unsafe_marshaler"))
                    object[".gogoproto.unsafe_marshaler"] = message[".gogoproto.unsafe_marshaler"];
                if (message[".gogoproto.unsafe_unmarshaler"] != null && message.hasOwnProperty(".gogoproto.unsafe_unmarshaler"))
                    object[".gogoproto.unsafe_unmarshaler"] = message[".gogoproto.unsafe_unmarshaler"];
                if (message[".gogoproto.goproto_extensions_map"] != null && message.hasOwnProperty(".gogoproto.goproto_extensions_map"))
                    object[".gogoproto.goproto_extensions_map"] = message[".gogoproto.goproto_extensions_map"];
                if (message[".gogoproto.goproto_unrecognized"] != null && message.hasOwnProperty(".gogoproto.goproto_unrecognized"))
                    object[".gogoproto.goproto_unrecognized"] = message[".gogoproto.goproto_unrecognized"];
                if (message[".gogoproto.protosizer"] != null && message.hasOwnProperty(".gogoproto.protosizer"))
                    object[".gogoproto.protosizer"] = message[".gogoproto.protosizer"];
                if (message[".gogoproto.compare"] != null && message.hasOwnProperty(".gogoproto.compare"))
                    object[".gogoproto.compare"] = message[".gogoproto.compare"];
                if (message[".gogoproto.typedecl"] != null && message.hasOwnProperty(".gogoproto.typedecl"))
                    object[".gogoproto.typedecl"] = message[".gogoproto.typedecl"];
                if (message[".gogoproto.messagename"] != null && message.hasOwnProperty(".gogoproto.messagename"))
                    object[".gogoproto.messagename"] = message[".gogoproto.messagename"];
                if (message[".gogoproto.goproto_sizecache"] != null && message.hasOwnProperty(".gogoproto.goproto_sizecache"))
                    object[".gogoproto.goproto_sizecache"] = message[".gogoproto.goproto_sizecache"];
                if (message[".gogoproto.goproto_unkeyed"] != null && message.hasOwnProperty(".gogoproto.goproto_unkeyed"))
                    object[".gogoproto.goproto_unkeyed"] = message[".gogoproto.goproto_unkeyed"];
                if (message[".gogoproto.stringer"] != null && message.hasOwnProperty(".gogoproto.stringer"))
                    object[".gogoproto.stringer"] = message[".gogoproto.stringer"];
                if (message[".cosmos_proto.implements_interface"] && message[".cosmos_proto.implements_interface"].length) {
                    object[".cosmos_proto.implements_interface"] = [];
                    for (let j = 0; j < message[".cosmos_proto.implements_interface"].length; ++j)
                        object[".cosmos_proto.implements_interface"][j] = message[".cosmos_proto.implements_interface"][j];
                }
                return object;
            };

            /**
             * Converts this MessageOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.MessageOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessageOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return MessageOptions;
        })();

        protobuf.FieldOptions = (function() {

            /**
             * Properties of a FieldOptions.
             * @memberof google.protobuf
             * @interface IFieldOptions
             * @property {google.protobuf.FieldOptions.CType|null} [ctype] FieldOptions ctype
             * @property {boolean|null} [packed] FieldOptions packed
             * @property {google.protobuf.FieldOptions.JSType|null} [jstype] FieldOptions jstype
             * @property {boolean|null} [lazy] FieldOptions lazy
             * @property {boolean|null} [deprecated] FieldOptions deprecated
             * @property {boolean|null} [weak] FieldOptions weak
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] FieldOptions uninterpreted_option
             * @property {boolean|null} [".gogoproto.nullable"] FieldOptions .gogoproto.nullable
             * @property {boolean|null} [".gogoproto.embed"] FieldOptions .gogoproto.embed
             * @property {string|null} [".gogoproto.customtype"] FieldOptions .gogoproto.customtype
             * @property {string|null} [".gogoproto.customname"] FieldOptions .gogoproto.customname
             * @property {string|null} [".gogoproto.jsontag"] FieldOptions .gogoproto.jsontag
             * @property {string|null} [".gogoproto.moretags"] FieldOptions .gogoproto.moretags
             * @property {string|null} [".gogoproto.casttype"] FieldOptions .gogoproto.casttype
             * @property {string|null} [".gogoproto.castkey"] FieldOptions .gogoproto.castkey
             * @property {string|null} [".gogoproto.castvalue"] FieldOptions .gogoproto.castvalue
             * @property {boolean|null} [".gogoproto.stdtime"] FieldOptions .gogoproto.stdtime
             * @property {boolean|null} [".gogoproto.stdduration"] FieldOptions .gogoproto.stdduration
             * @property {boolean|null} [".gogoproto.wktpointer"] FieldOptions .gogoproto.wktpointer
             * @property {string|null} [".gogoproto.castrepeated"] FieldOptions .gogoproto.castrepeated
             * @property {string|null} [".cosmos_proto.accepts_interface"] FieldOptions .cosmos_proto.accepts_interface
             * @property {string|null} [".cosmos_proto.scalar"] FieldOptions .cosmos_proto.scalar
             */

            /**
             * Constructs a new FieldOptions.
             * @memberof google.protobuf
             * @classdesc Represents a FieldOptions.
             * @implements IFieldOptions
             * @constructor
             * @param {google.protobuf.IFieldOptions=} [properties] Properties to set
             */
            function FieldOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FieldOptions ctype.
             * @member {google.protobuf.FieldOptions.CType} ctype
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.ctype = 0;

            /**
             * FieldOptions packed.
             * @member {boolean} packed
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.packed = false;

            /**
             * FieldOptions jstype.
             * @member {google.protobuf.FieldOptions.JSType} jstype
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.jstype = 0;

            /**
             * FieldOptions lazy.
             * @member {boolean} lazy
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.lazy = false;

            /**
             * FieldOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.deprecated = false;

            /**
             * FieldOptions weak.
             * @member {boolean} weak
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.weak = false;

            /**
             * FieldOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * FieldOptions .gogoproto.nullable.
             * @member {boolean} .gogoproto.nullable
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.nullable"] = false;

            /**
             * FieldOptions .gogoproto.embed.
             * @member {boolean} .gogoproto.embed
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.embed"] = false;

            /**
             * FieldOptions .gogoproto.customtype.
             * @member {string} .gogoproto.customtype
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.customtype"] = "";

            /**
             * FieldOptions .gogoproto.customname.
             * @member {string} .gogoproto.customname
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.customname"] = "";

            /**
             * FieldOptions .gogoproto.jsontag.
             * @member {string} .gogoproto.jsontag
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.jsontag"] = "";

            /**
             * FieldOptions .gogoproto.moretags.
             * @member {string} .gogoproto.moretags
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.moretags"] = "";

            /**
             * FieldOptions .gogoproto.casttype.
             * @member {string} .gogoproto.casttype
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.casttype"] = "";

            /**
             * FieldOptions .gogoproto.castkey.
             * @member {string} .gogoproto.castkey
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.castkey"] = "";

            /**
             * FieldOptions .gogoproto.castvalue.
             * @member {string} .gogoproto.castvalue
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.castvalue"] = "";

            /**
             * FieldOptions .gogoproto.stdtime.
             * @member {boolean} .gogoproto.stdtime
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.stdtime"] = false;

            /**
             * FieldOptions .gogoproto.stdduration.
             * @member {boolean} .gogoproto.stdduration
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.stdduration"] = false;

            /**
             * FieldOptions .gogoproto.wktpointer.
             * @member {boolean} .gogoproto.wktpointer
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.wktpointer"] = false;

            /**
             * FieldOptions .gogoproto.castrepeated.
             * @member {string} .gogoproto.castrepeated
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".gogoproto.castrepeated"] = "";

            /**
             * FieldOptions .cosmos_proto.accepts_interface.
             * @member {string} .cosmos_proto.accepts_interface
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".cosmos_proto.accepts_interface"] = "";

            /**
             * FieldOptions .cosmos_proto.scalar.
             * @member {string} .cosmos_proto.scalar
             * @memberof google.protobuf.FieldOptions
             * @instance
             */
            FieldOptions.prototype[".cosmos_proto.scalar"] = "";

            /**
             * Encodes the specified FieldOptions message. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {google.protobuf.IFieldOptions} message FieldOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.ctype != null && Object.hasOwnProperty.call(message, "ctype"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.ctype);
                if (message.packed != null && Object.hasOwnProperty.call(message, "packed"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.packed);
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.deprecated);
                if (message.lazy != null && Object.hasOwnProperty.call(message, "lazy"))
                    writer.uint32(/* id 5, wireType 0 =*/40).bool(message.lazy);
                if (message.jstype != null && Object.hasOwnProperty.call(message, "jstype"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int32(message.jstype);
                if (message.weak != null && Object.hasOwnProperty.call(message, "weak"))
                    writer.uint32(/* id 10, wireType 0 =*/80).bool(message.weak);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".gogoproto.nullable"] != null && Object.hasOwnProperty.call(message, ".gogoproto.nullable"))
                    writer.uint32(/* id 65001, wireType 0 =*/520008).bool(message[".gogoproto.nullable"]);
                if (message[".gogoproto.embed"] != null && Object.hasOwnProperty.call(message, ".gogoproto.embed"))
                    writer.uint32(/* id 65002, wireType 0 =*/520016).bool(message[".gogoproto.embed"]);
                if (message[".gogoproto.customtype"] != null && Object.hasOwnProperty.call(message, ".gogoproto.customtype"))
                    writer.uint32(/* id 65003, wireType 2 =*/520026).string(message[".gogoproto.customtype"]);
                if (message[".gogoproto.customname"] != null && Object.hasOwnProperty.call(message, ".gogoproto.customname"))
                    writer.uint32(/* id 65004, wireType 2 =*/520034).string(message[".gogoproto.customname"]);
                if (message[".gogoproto.jsontag"] != null && Object.hasOwnProperty.call(message, ".gogoproto.jsontag"))
                    writer.uint32(/* id 65005, wireType 2 =*/520042).string(message[".gogoproto.jsontag"]);
                if (message[".gogoproto.moretags"] != null && Object.hasOwnProperty.call(message, ".gogoproto.moretags"))
                    writer.uint32(/* id 65006, wireType 2 =*/520050).string(message[".gogoproto.moretags"]);
                if (message[".gogoproto.casttype"] != null && Object.hasOwnProperty.call(message, ".gogoproto.casttype"))
                    writer.uint32(/* id 65007, wireType 2 =*/520058).string(message[".gogoproto.casttype"]);
                if (message[".gogoproto.castkey"] != null && Object.hasOwnProperty.call(message, ".gogoproto.castkey"))
                    writer.uint32(/* id 65008, wireType 2 =*/520066).string(message[".gogoproto.castkey"]);
                if (message[".gogoproto.castvalue"] != null && Object.hasOwnProperty.call(message, ".gogoproto.castvalue"))
                    writer.uint32(/* id 65009, wireType 2 =*/520074).string(message[".gogoproto.castvalue"]);
                if (message[".gogoproto.stdtime"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stdtime"))
                    writer.uint32(/* id 65010, wireType 0 =*/520080).bool(message[".gogoproto.stdtime"]);
                if (message[".gogoproto.stdduration"] != null && Object.hasOwnProperty.call(message, ".gogoproto.stdduration"))
                    writer.uint32(/* id 65011, wireType 0 =*/520088).bool(message[".gogoproto.stdduration"]);
                if (message[".gogoproto.wktpointer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.wktpointer"))
                    writer.uint32(/* id 65012, wireType 0 =*/520096).bool(message[".gogoproto.wktpointer"]);
                if (message[".gogoproto.castrepeated"] != null && Object.hasOwnProperty.call(message, ".gogoproto.castrepeated"))
                    writer.uint32(/* id 65013, wireType 2 =*/520106).string(message[".gogoproto.castrepeated"]);
                if (message[".cosmos_proto.accepts_interface"] != null && Object.hasOwnProperty.call(message, ".cosmos_proto.accepts_interface"))
                    writer.uint32(/* id 93001, wireType 2 =*/744010).string(message[".cosmos_proto.accepts_interface"]);
                if (message[".cosmos_proto.scalar"] != null && Object.hasOwnProperty.call(message, ".cosmos_proto.scalar"))
                    writer.uint32(/* id 93002, wireType 2 =*/744018).string(message[".cosmos_proto.scalar"]);
                return writer;
            };

            /**
             * Encodes the specified FieldOptions message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {google.protobuf.IFieldOptions} message FieldOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FieldOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FieldOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.FieldOptions} FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.FieldOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.ctype = reader.int32();
                        break;
                    case 2:
                        message.packed = reader.bool();
                        break;
                    case 6:
                        message.jstype = reader.int32();
                        break;
                    case 5:
                        message.lazy = reader.bool();
                        break;
                    case 3:
                        message.deprecated = reader.bool();
                        break;
                    case 10:
                        message.weak = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 65001:
                        message[".gogoproto.nullable"] = reader.bool();
                        break;
                    case 65002:
                        message[".gogoproto.embed"] = reader.bool();
                        break;
                    case 65003:
                        message[".gogoproto.customtype"] = reader.string();
                        break;
                    case 65004:
                        message[".gogoproto.customname"] = reader.string();
                        break;
                    case 65005:
                        message[".gogoproto.jsontag"] = reader.string();
                        break;
                    case 65006:
                        message[".gogoproto.moretags"] = reader.string();
                        break;
                    case 65007:
                        message[".gogoproto.casttype"] = reader.string();
                        break;
                    case 65008:
                        message[".gogoproto.castkey"] = reader.string();
                        break;
                    case 65009:
                        message[".gogoproto.castvalue"] = reader.string();
                        break;
                    case 65010:
                        message[".gogoproto.stdtime"] = reader.bool();
                        break;
                    case 65011:
                        message[".gogoproto.stdduration"] = reader.bool();
                        break;
                    case 65012:
                        message[".gogoproto.wktpointer"] = reader.bool();
                        break;
                    case 65013:
                        message[".gogoproto.castrepeated"] = reader.string();
                        break;
                    case 93001:
                        message[".cosmos_proto.accepts_interface"] = reader.string();
                        break;
                    case 93002:
                        message[".cosmos_proto.scalar"] = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FieldOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.FieldOptions} FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FieldOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FieldOptions message.
             * @function verify
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FieldOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.ctype != null && message.hasOwnProperty("ctype"))
                    switch (message.ctype) {
                    default:
                        return "ctype: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.packed != null && message.hasOwnProperty("packed"))
                    if (typeof message.packed !== "boolean")
                        return "packed: boolean expected";
                if (message.jstype != null && message.hasOwnProperty("jstype"))
                    switch (message.jstype) {
                    default:
                        return "jstype: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.lazy != null && message.hasOwnProperty("lazy"))
                    if (typeof message.lazy !== "boolean")
                        return "lazy: boolean expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.weak != null && message.hasOwnProperty("weak"))
                    if (typeof message.weak !== "boolean")
                        return "weak: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".gogoproto.nullable"] != null && message.hasOwnProperty(".gogoproto.nullable"))
                    if (typeof message[".gogoproto.nullable"] !== "boolean")
                        return ".gogoproto.nullable: boolean expected";
                if (message[".gogoproto.embed"] != null && message.hasOwnProperty(".gogoproto.embed"))
                    if (typeof message[".gogoproto.embed"] !== "boolean")
                        return ".gogoproto.embed: boolean expected";
                if (message[".gogoproto.customtype"] != null && message.hasOwnProperty(".gogoproto.customtype"))
                    if (!$util.isString(message[".gogoproto.customtype"]))
                        return ".gogoproto.customtype: string expected";
                if (message[".gogoproto.customname"] != null && message.hasOwnProperty(".gogoproto.customname"))
                    if (!$util.isString(message[".gogoproto.customname"]))
                        return ".gogoproto.customname: string expected";
                if (message[".gogoproto.jsontag"] != null && message.hasOwnProperty(".gogoproto.jsontag"))
                    if (!$util.isString(message[".gogoproto.jsontag"]))
                        return ".gogoproto.jsontag: string expected";
                if (message[".gogoproto.moretags"] != null && message.hasOwnProperty(".gogoproto.moretags"))
                    if (!$util.isString(message[".gogoproto.moretags"]))
                        return ".gogoproto.moretags: string expected";
                if (message[".gogoproto.casttype"] != null && message.hasOwnProperty(".gogoproto.casttype"))
                    if (!$util.isString(message[".gogoproto.casttype"]))
                        return ".gogoproto.casttype: string expected";
                if (message[".gogoproto.castkey"] != null && message.hasOwnProperty(".gogoproto.castkey"))
                    if (!$util.isString(message[".gogoproto.castkey"]))
                        return ".gogoproto.castkey: string expected";
                if (message[".gogoproto.castvalue"] != null && message.hasOwnProperty(".gogoproto.castvalue"))
                    if (!$util.isString(message[".gogoproto.castvalue"]))
                        return ".gogoproto.castvalue: string expected";
                if (message[".gogoproto.stdtime"] != null && message.hasOwnProperty(".gogoproto.stdtime"))
                    if (typeof message[".gogoproto.stdtime"] !== "boolean")
                        return ".gogoproto.stdtime: boolean expected";
                if (message[".gogoproto.stdduration"] != null && message.hasOwnProperty(".gogoproto.stdduration"))
                    if (typeof message[".gogoproto.stdduration"] !== "boolean")
                        return ".gogoproto.stdduration: boolean expected";
                if (message[".gogoproto.wktpointer"] != null && message.hasOwnProperty(".gogoproto.wktpointer"))
                    if (typeof message[".gogoproto.wktpointer"] !== "boolean")
                        return ".gogoproto.wktpointer: boolean expected";
                if (message[".gogoproto.castrepeated"] != null && message.hasOwnProperty(".gogoproto.castrepeated"))
                    if (!$util.isString(message[".gogoproto.castrepeated"]))
                        return ".gogoproto.castrepeated: string expected";
                if (message[".cosmos_proto.accepts_interface"] != null && message.hasOwnProperty(".cosmos_proto.accepts_interface"))
                    if (!$util.isString(message[".cosmos_proto.accepts_interface"]))
                        return ".cosmos_proto.accepts_interface: string expected";
                if (message[".cosmos_proto.scalar"] != null && message.hasOwnProperty(".cosmos_proto.scalar"))
                    if (!$util.isString(message[".cosmos_proto.scalar"]))
                        return ".cosmos_proto.scalar: string expected";
                return null;
            };

            /**
             * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.FieldOptions} FieldOptions
             */
            FieldOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.FieldOptions)
                    return object;
                let message = new $root.google.protobuf.FieldOptions();
                switch (object.ctype) {
                case "STRING":
                case 0:
                    message.ctype = 0;
                    break;
                case "CORD":
                case 1:
                    message.ctype = 1;
                    break;
                case "STRING_PIECE":
                case 2:
                    message.ctype = 2;
                    break;
                }
                if (object.packed != null)
                    message.packed = Boolean(object.packed);
                switch (object.jstype) {
                case "JS_NORMAL":
                case 0:
                    message.jstype = 0;
                    break;
                case "JS_STRING":
                case 1:
                    message.jstype = 1;
                    break;
                case "JS_NUMBER":
                case 2:
                    message.jstype = 2;
                    break;
                }
                if (object.lazy != null)
                    message.lazy = Boolean(object.lazy);
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.weak != null)
                    message.weak = Boolean(object.weak);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.FieldOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.FieldOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".gogoproto.nullable"] != null)
                    message[".gogoproto.nullable"] = Boolean(object[".gogoproto.nullable"]);
                if (object[".gogoproto.embed"] != null)
                    message[".gogoproto.embed"] = Boolean(object[".gogoproto.embed"]);
                if (object[".gogoproto.customtype"] != null)
                    message[".gogoproto.customtype"] = String(object[".gogoproto.customtype"]);
                if (object[".gogoproto.customname"] != null)
                    message[".gogoproto.customname"] = String(object[".gogoproto.customname"]);
                if (object[".gogoproto.jsontag"] != null)
                    message[".gogoproto.jsontag"] = String(object[".gogoproto.jsontag"]);
                if (object[".gogoproto.moretags"] != null)
                    message[".gogoproto.moretags"] = String(object[".gogoproto.moretags"]);
                if (object[".gogoproto.casttype"] != null)
                    message[".gogoproto.casttype"] = String(object[".gogoproto.casttype"]);
                if (object[".gogoproto.castkey"] != null)
                    message[".gogoproto.castkey"] = String(object[".gogoproto.castkey"]);
                if (object[".gogoproto.castvalue"] != null)
                    message[".gogoproto.castvalue"] = String(object[".gogoproto.castvalue"]);
                if (object[".gogoproto.stdtime"] != null)
                    message[".gogoproto.stdtime"] = Boolean(object[".gogoproto.stdtime"]);
                if (object[".gogoproto.stdduration"] != null)
                    message[".gogoproto.stdduration"] = Boolean(object[".gogoproto.stdduration"]);
                if (object[".gogoproto.wktpointer"] != null)
                    message[".gogoproto.wktpointer"] = Boolean(object[".gogoproto.wktpointer"]);
                if (object[".gogoproto.castrepeated"] != null)
                    message[".gogoproto.castrepeated"] = String(object[".gogoproto.castrepeated"]);
                if (object[".cosmos_proto.accepts_interface"] != null)
                    message[".cosmos_proto.accepts_interface"] = String(object[".cosmos_proto.accepts_interface"]);
                if (object[".cosmos_proto.scalar"] != null)
                    message[".cosmos_proto.scalar"] = String(object[".cosmos_proto.scalar"]);
                return message;
            };

            /**
             * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.FieldOptions
             * @static
             * @param {google.protobuf.FieldOptions} message FieldOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FieldOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (options.defaults) {
                    object.ctype = options.enums === String ? "STRING" : 0;
                    object.packed = false;
                    object.deprecated = false;
                    object.lazy = false;
                    object.jstype = options.enums === String ? "JS_NORMAL" : 0;
                    object.weak = false;
                    object[".gogoproto.nullable"] = false;
                    object[".gogoproto.embed"] = false;
                    object[".gogoproto.customtype"] = "";
                    object[".gogoproto.customname"] = "";
                    object[".gogoproto.jsontag"] = "";
                    object[".gogoproto.moretags"] = "";
                    object[".gogoproto.casttype"] = "";
                    object[".gogoproto.castkey"] = "";
                    object[".gogoproto.castvalue"] = "";
                    object[".gogoproto.stdtime"] = false;
                    object[".gogoproto.stdduration"] = false;
                    object[".gogoproto.wktpointer"] = false;
                    object[".gogoproto.castrepeated"] = "";
                    object[".cosmos_proto.accepts_interface"] = "";
                    object[".cosmos_proto.scalar"] = "";
                }
                if (message.ctype != null && message.hasOwnProperty("ctype"))
                    object.ctype = options.enums === String ? $root.google.protobuf.FieldOptions.CType[message.ctype] : message.ctype;
                if (message.packed != null && message.hasOwnProperty("packed"))
                    object.packed = message.packed;
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.lazy != null && message.hasOwnProperty("lazy"))
                    object.lazy = message.lazy;
                if (message.jstype != null && message.hasOwnProperty("jstype"))
                    object.jstype = options.enums === String ? $root.google.protobuf.FieldOptions.JSType[message.jstype] : message.jstype;
                if (message.weak != null && message.hasOwnProperty("weak"))
                    object.weak = message.weak;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".gogoproto.nullable"] != null && message.hasOwnProperty(".gogoproto.nullable"))
                    object[".gogoproto.nullable"] = message[".gogoproto.nullable"];
                if (message[".gogoproto.embed"] != null && message.hasOwnProperty(".gogoproto.embed"))
                    object[".gogoproto.embed"] = message[".gogoproto.embed"];
                if (message[".gogoproto.customtype"] != null && message.hasOwnProperty(".gogoproto.customtype"))
                    object[".gogoproto.customtype"] = message[".gogoproto.customtype"];
                if (message[".gogoproto.customname"] != null && message.hasOwnProperty(".gogoproto.customname"))
                    object[".gogoproto.customname"] = message[".gogoproto.customname"];
                if (message[".gogoproto.jsontag"] != null && message.hasOwnProperty(".gogoproto.jsontag"))
                    object[".gogoproto.jsontag"] = message[".gogoproto.jsontag"];
                if (message[".gogoproto.moretags"] != null && message.hasOwnProperty(".gogoproto.moretags"))
                    object[".gogoproto.moretags"] = message[".gogoproto.moretags"];
                if (message[".gogoproto.casttype"] != null && message.hasOwnProperty(".gogoproto.casttype"))
                    object[".gogoproto.casttype"] = message[".gogoproto.casttype"];
                if (message[".gogoproto.castkey"] != null && message.hasOwnProperty(".gogoproto.castkey"))
                    object[".gogoproto.castkey"] = message[".gogoproto.castkey"];
                if (message[".gogoproto.castvalue"] != null && message.hasOwnProperty(".gogoproto.castvalue"))
                    object[".gogoproto.castvalue"] = message[".gogoproto.castvalue"];
                if (message[".gogoproto.stdtime"] != null && message.hasOwnProperty(".gogoproto.stdtime"))
                    object[".gogoproto.stdtime"] = message[".gogoproto.stdtime"];
                if (message[".gogoproto.stdduration"] != null && message.hasOwnProperty(".gogoproto.stdduration"))
                    object[".gogoproto.stdduration"] = message[".gogoproto.stdduration"];
                if (message[".gogoproto.wktpointer"] != null && message.hasOwnProperty(".gogoproto.wktpointer"))
                    object[".gogoproto.wktpointer"] = message[".gogoproto.wktpointer"];
                if (message[".gogoproto.castrepeated"] != null && message.hasOwnProperty(".gogoproto.castrepeated"))
                    object[".gogoproto.castrepeated"] = message[".gogoproto.castrepeated"];
                if (message[".cosmos_proto.accepts_interface"] != null && message.hasOwnProperty(".cosmos_proto.accepts_interface"))
                    object[".cosmos_proto.accepts_interface"] = message[".cosmos_proto.accepts_interface"];
                if (message[".cosmos_proto.scalar"] != null && message.hasOwnProperty(".cosmos_proto.scalar"))
                    object[".cosmos_proto.scalar"] = message[".cosmos_proto.scalar"];
                return object;
            };

            /**
             * Converts this FieldOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.FieldOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FieldOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * CType enum.
             * @name google.protobuf.FieldOptions.CType
             * @enum {number}
             * @property {number} STRING=0 STRING value
             * @property {number} CORD=1 CORD value
             * @property {number} STRING_PIECE=2 STRING_PIECE value
             */
            FieldOptions.CType = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "STRING"] = 0;
                values[valuesById[1] = "CORD"] = 1;
                values[valuesById[2] = "STRING_PIECE"] = 2;
                return values;
            })();

            /**
             * JSType enum.
             * @name google.protobuf.FieldOptions.JSType
             * @enum {number}
             * @property {number} JS_NORMAL=0 JS_NORMAL value
             * @property {number} JS_STRING=1 JS_STRING value
             * @property {number} JS_NUMBER=2 JS_NUMBER value
             */
            FieldOptions.JSType = (function() {
                const valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "JS_NORMAL"] = 0;
                values[valuesById[1] = "JS_STRING"] = 1;
                values[valuesById[2] = "JS_NUMBER"] = 2;
                return values;
            })();

            return FieldOptions;
        })();

        protobuf.OneofOptions = (function() {

            /**
             * Properties of an OneofOptions.
             * @memberof google.protobuf
             * @interface IOneofOptions
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] OneofOptions uninterpreted_option
             */

            /**
             * Constructs a new OneofOptions.
             * @memberof google.protobuf
             * @classdesc Represents an OneofOptions.
             * @implements IOneofOptions
             * @constructor
             * @param {google.protobuf.IOneofOptions=} [properties] Properties to set
             */
            function OneofOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OneofOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.OneofOptions
             * @instance
             */
            OneofOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * Encodes the specified OneofOptions message. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {google.protobuf.IOneofOptions} message OneofOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified OneofOptions message, length delimited. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {google.protobuf.IOneofOptions} message OneofOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OneofOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OneofOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.OneofOptions} OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.OneofOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an OneofOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.OneofOptions} OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OneofOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OneofOptions message.
             * @function verify
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OneofOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.OneofOptions} OneofOptions
             */
            OneofOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.OneofOptions)
                    return object;
                let message = new $root.google.protobuf.OneofOptions();
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.OneofOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.OneofOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.OneofOptions
             * @static
             * @param {google.protobuf.OneofOptions} message OneofOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OneofOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                return object;
            };

            /**
             * Converts this OneofOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.OneofOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OneofOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return OneofOptions;
        })();

        protobuf.EnumOptions = (function() {

            /**
             * Properties of an EnumOptions.
             * @memberof google.protobuf
             * @interface IEnumOptions
             * @property {boolean|null} [allow_alias] EnumOptions allow_alias
             * @property {boolean|null} [deprecated] EnumOptions deprecated
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] EnumOptions uninterpreted_option
             * @property {boolean|null} [".gogoproto.goproto_enum_prefix"] EnumOptions .gogoproto.goproto_enum_prefix
             * @property {boolean|null} [".gogoproto.goproto_enum_stringer"] EnumOptions .gogoproto.goproto_enum_stringer
             * @property {boolean|null} [".gogoproto.enum_stringer"] EnumOptions .gogoproto.enum_stringer
             * @property {string|null} [".gogoproto.enum_customname"] EnumOptions .gogoproto.enum_customname
             * @property {boolean|null} [".gogoproto.enumdecl"] EnumOptions .gogoproto.enumdecl
             */

            /**
             * Constructs a new EnumOptions.
             * @memberof google.protobuf
             * @classdesc Represents an EnumOptions.
             * @implements IEnumOptions
             * @constructor
             * @param {google.protobuf.IEnumOptions=} [properties] Properties to set
             */
            function EnumOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * EnumOptions allow_alias.
             * @member {boolean} allow_alias
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype.allow_alias = false;

            /**
             * EnumOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype.deprecated = false;

            /**
             * EnumOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * EnumOptions .gogoproto.goproto_enum_prefix.
             * @member {boolean} .gogoproto.goproto_enum_prefix
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype[".gogoproto.goproto_enum_prefix"] = false;

            /**
             * EnumOptions .gogoproto.goproto_enum_stringer.
             * @member {boolean} .gogoproto.goproto_enum_stringer
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype[".gogoproto.goproto_enum_stringer"] = false;

            /**
             * EnumOptions .gogoproto.enum_stringer.
             * @member {boolean} .gogoproto.enum_stringer
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype[".gogoproto.enum_stringer"] = false;

            /**
             * EnumOptions .gogoproto.enum_customname.
             * @member {string} .gogoproto.enum_customname
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype[".gogoproto.enum_customname"] = "";

            /**
             * EnumOptions .gogoproto.enumdecl.
             * @member {boolean} .gogoproto.enumdecl
             * @memberof google.protobuf.EnumOptions
             * @instance
             */
            EnumOptions.prototype[".gogoproto.enumdecl"] = false;

            /**
             * Encodes the specified EnumOptions message. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {google.protobuf.IEnumOptions} message EnumOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.allow_alias != null && Object.hasOwnProperty.call(message, "allow_alias"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.allow_alias);
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.deprecated);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".gogoproto.goproto_enum_prefix"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_enum_prefix"))
                    writer.uint32(/* id 62001, wireType 0 =*/496008).bool(message[".gogoproto.goproto_enum_prefix"]);
                if (message[".gogoproto.goproto_enum_stringer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.goproto_enum_stringer"))
                    writer.uint32(/* id 62021, wireType 0 =*/496168).bool(message[".gogoproto.goproto_enum_stringer"]);
                if (message[".gogoproto.enum_stringer"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enum_stringer"))
                    writer.uint32(/* id 62022, wireType 0 =*/496176).bool(message[".gogoproto.enum_stringer"]);
                if (message[".gogoproto.enum_customname"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enum_customname"))
                    writer.uint32(/* id 62023, wireType 2 =*/496186).string(message[".gogoproto.enum_customname"]);
                if (message[".gogoproto.enumdecl"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enumdecl"))
                    writer.uint32(/* id 62024, wireType 0 =*/496192).bool(message[".gogoproto.enumdecl"]);
                return writer;
            };

            /**
             * Encodes the specified EnumOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {google.protobuf.IEnumOptions} message EnumOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an EnumOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.EnumOptions} EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.EnumOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 2:
                        message.allow_alias = reader.bool();
                        break;
                    case 3:
                        message.deprecated = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 62001:
                        message[".gogoproto.goproto_enum_prefix"] = reader.bool();
                        break;
                    case 62021:
                        message[".gogoproto.goproto_enum_stringer"] = reader.bool();
                        break;
                    case 62022:
                        message[".gogoproto.enum_stringer"] = reader.bool();
                        break;
                    case 62023:
                        message[".gogoproto.enum_customname"] = reader.string();
                        break;
                    case 62024:
                        message[".gogoproto.enumdecl"] = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an EnumOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.EnumOptions} EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an EnumOptions message.
             * @function verify
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            EnumOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.allow_alias != null && message.hasOwnProperty("allow_alias"))
                    if (typeof message.allow_alias !== "boolean")
                        return "allow_alias: boolean expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".gogoproto.goproto_enum_prefix"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_prefix"))
                    if (typeof message[".gogoproto.goproto_enum_prefix"] !== "boolean")
                        return ".gogoproto.goproto_enum_prefix: boolean expected";
                if (message[".gogoproto.goproto_enum_stringer"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_stringer"))
                    if (typeof message[".gogoproto.goproto_enum_stringer"] !== "boolean")
                        return ".gogoproto.goproto_enum_stringer: boolean expected";
                if (message[".gogoproto.enum_stringer"] != null && message.hasOwnProperty(".gogoproto.enum_stringer"))
                    if (typeof message[".gogoproto.enum_stringer"] !== "boolean")
                        return ".gogoproto.enum_stringer: boolean expected";
                if (message[".gogoproto.enum_customname"] != null && message.hasOwnProperty(".gogoproto.enum_customname"))
                    if (!$util.isString(message[".gogoproto.enum_customname"]))
                        return ".gogoproto.enum_customname: string expected";
                if (message[".gogoproto.enumdecl"] != null && message.hasOwnProperty(".gogoproto.enumdecl"))
                    if (typeof message[".gogoproto.enumdecl"] !== "boolean")
                        return ".gogoproto.enumdecl: boolean expected";
                return null;
            };

            /**
             * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.EnumOptions} EnumOptions
             */
            EnumOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.EnumOptions)
                    return object;
                let message = new $root.google.protobuf.EnumOptions();
                if (object.allow_alias != null)
                    message.allow_alias = Boolean(object.allow_alias);
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.EnumOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.EnumOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".gogoproto.goproto_enum_prefix"] != null)
                    message[".gogoproto.goproto_enum_prefix"] = Boolean(object[".gogoproto.goproto_enum_prefix"]);
                if (object[".gogoproto.goproto_enum_stringer"] != null)
                    message[".gogoproto.goproto_enum_stringer"] = Boolean(object[".gogoproto.goproto_enum_stringer"]);
                if (object[".gogoproto.enum_stringer"] != null)
                    message[".gogoproto.enum_stringer"] = Boolean(object[".gogoproto.enum_stringer"]);
                if (object[".gogoproto.enum_customname"] != null)
                    message[".gogoproto.enum_customname"] = String(object[".gogoproto.enum_customname"]);
                if (object[".gogoproto.enumdecl"] != null)
                    message[".gogoproto.enumdecl"] = Boolean(object[".gogoproto.enumdecl"]);
                return message;
            };

            /**
             * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.EnumOptions
             * @static
             * @param {google.protobuf.EnumOptions} message EnumOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (options.defaults) {
                    object.allow_alias = false;
                    object.deprecated = false;
                    object[".gogoproto.goproto_enum_prefix"] = false;
                    object[".gogoproto.goproto_enum_stringer"] = false;
                    object[".gogoproto.enum_stringer"] = false;
                    object[".gogoproto.enum_customname"] = "";
                    object[".gogoproto.enumdecl"] = false;
                }
                if (message.allow_alias != null && message.hasOwnProperty("allow_alias"))
                    object.allow_alias = message.allow_alias;
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".gogoproto.goproto_enum_prefix"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_prefix"))
                    object[".gogoproto.goproto_enum_prefix"] = message[".gogoproto.goproto_enum_prefix"];
                if (message[".gogoproto.goproto_enum_stringer"] != null && message.hasOwnProperty(".gogoproto.goproto_enum_stringer"))
                    object[".gogoproto.goproto_enum_stringer"] = message[".gogoproto.goproto_enum_stringer"];
                if (message[".gogoproto.enum_stringer"] != null && message.hasOwnProperty(".gogoproto.enum_stringer"))
                    object[".gogoproto.enum_stringer"] = message[".gogoproto.enum_stringer"];
                if (message[".gogoproto.enum_customname"] != null && message.hasOwnProperty(".gogoproto.enum_customname"))
                    object[".gogoproto.enum_customname"] = message[".gogoproto.enum_customname"];
                if (message[".gogoproto.enumdecl"] != null && message.hasOwnProperty(".gogoproto.enumdecl"))
                    object[".gogoproto.enumdecl"] = message[".gogoproto.enumdecl"];
                return object;
            };

            /**
             * Converts this EnumOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.EnumOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return EnumOptions;
        })();

        protobuf.EnumValueOptions = (function() {

            /**
             * Properties of an EnumValueOptions.
             * @memberof google.protobuf
             * @interface IEnumValueOptions
             * @property {boolean|null} [deprecated] EnumValueOptions deprecated
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] EnumValueOptions uninterpreted_option
             * @property {string|null} [".gogoproto.enumvalue_customname"] EnumValueOptions .gogoproto.enumvalue_customname
             */

            /**
             * Constructs a new EnumValueOptions.
             * @memberof google.protobuf
             * @classdesc Represents an EnumValueOptions.
             * @implements IEnumValueOptions
             * @constructor
             * @param {google.protobuf.IEnumValueOptions=} [properties] Properties to set
             */
            function EnumValueOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * EnumValueOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.EnumValueOptions
             * @instance
             */
            EnumValueOptions.prototype.deprecated = false;

            /**
             * EnumValueOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.EnumValueOptions
             * @instance
             */
            EnumValueOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * EnumValueOptions .gogoproto.enumvalue_customname.
             * @member {string} .gogoproto.enumvalue_customname
             * @memberof google.protobuf.EnumValueOptions
             * @instance
             */
            EnumValueOptions.prototype[".gogoproto.enumvalue_customname"] = "";

            /**
             * Encodes the specified EnumValueOptions message. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {google.protobuf.IEnumValueOptions} message EnumValueOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumValueOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.deprecated);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".gogoproto.enumvalue_customname"] != null && Object.hasOwnProperty.call(message, ".gogoproto.enumvalue_customname"))
                    writer.uint32(/* id 66001, wireType 2 =*/528010).string(message[".gogoproto.enumvalue_customname"]);
                return writer;
            };

            /**
             * Encodes the specified EnumValueOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {google.protobuf.IEnumValueOptions} message EnumValueOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            EnumValueOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.EnumValueOptions} EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumValueOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.EnumValueOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.deprecated = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 66001:
                        message[".gogoproto.enumvalue_customname"] = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.EnumValueOptions} EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            EnumValueOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an EnumValueOptions message.
             * @function verify
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            EnumValueOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".gogoproto.enumvalue_customname"] != null && message.hasOwnProperty(".gogoproto.enumvalue_customname"))
                    if (!$util.isString(message[".gogoproto.enumvalue_customname"]))
                        return ".gogoproto.enumvalue_customname: string expected";
                return null;
            };

            /**
             * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.EnumValueOptions} EnumValueOptions
             */
            EnumValueOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.EnumValueOptions)
                    return object;
                let message = new $root.google.protobuf.EnumValueOptions();
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.EnumValueOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.EnumValueOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".gogoproto.enumvalue_customname"] != null)
                    message[".gogoproto.enumvalue_customname"] = String(object[".gogoproto.enumvalue_customname"]);
                return message;
            };

            /**
             * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.EnumValueOptions
             * @static
             * @param {google.protobuf.EnumValueOptions} message EnumValueOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            EnumValueOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (options.defaults) {
                    object.deprecated = false;
                    object[".gogoproto.enumvalue_customname"] = "";
                }
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".gogoproto.enumvalue_customname"] != null && message.hasOwnProperty(".gogoproto.enumvalue_customname"))
                    object[".gogoproto.enumvalue_customname"] = message[".gogoproto.enumvalue_customname"];
                return object;
            };

            /**
             * Converts this EnumValueOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.EnumValueOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            EnumValueOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return EnumValueOptions;
        })();

        protobuf.ServiceOptions = (function() {

            /**
             * Properties of a ServiceOptions.
             * @memberof google.protobuf
             * @interface IServiceOptions
             * @property {boolean|null} [deprecated] ServiceOptions deprecated
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] ServiceOptions uninterpreted_option
             */

            /**
             * Constructs a new ServiceOptions.
             * @memberof google.protobuf
             * @classdesc Represents a ServiceOptions.
             * @implements IServiceOptions
             * @constructor
             * @param {google.protobuf.IServiceOptions=} [properties] Properties to set
             */
            function ServiceOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ServiceOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.ServiceOptions
             * @instance
             */
            ServiceOptions.prototype.deprecated = false;

            /**
             * ServiceOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.ServiceOptions
             * @instance
             */
            ServiceOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * Encodes the specified ServiceOptions message. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {google.protobuf.IServiceOptions} message ServiceOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServiceOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 33, wireType 0 =*/264).bool(message.deprecated);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ServiceOptions message, length delimited. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {google.protobuf.IServiceOptions} message ServiceOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ServiceOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.ServiceOptions} ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServiceOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.ServiceOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 33:
                        message.deprecated = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.ServiceOptions} ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ServiceOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ServiceOptions message.
             * @function verify
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ServiceOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.ServiceOptions} ServiceOptions
             */
            ServiceOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.ServiceOptions)
                    return object;
                let message = new $root.google.protobuf.ServiceOptions();
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.ServiceOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.ServiceOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.ServiceOptions
             * @static
             * @param {google.protobuf.ServiceOptions} message ServiceOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ServiceOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (options.defaults)
                    object.deprecated = false;
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                return object;
            };

            /**
             * Converts this ServiceOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.ServiceOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ServiceOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ServiceOptions;
        })();

        protobuf.MethodOptions = (function() {

            /**
             * Properties of a MethodOptions.
             * @memberof google.protobuf
             * @interface IMethodOptions
             * @property {boolean|null} [deprecated] MethodOptions deprecated
             * @property {Array.<google.protobuf.IUninterpretedOption>|null} [uninterpreted_option] MethodOptions uninterpreted_option
             * @property {google.api.IHttpRule|null} [".google.api.http"] MethodOptions .google.api.http
             */

            /**
             * Constructs a new MethodOptions.
             * @memberof google.protobuf
             * @classdesc Represents a MethodOptions.
             * @implements IMethodOptions
             * @constructor
             * @param {google.protobuf.IMethodOptions=} [properties] Properties to set
             */
            function MethodOptions(properties) {
                this.uninterpreted_option = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MethodOptions deprecated.
             * @member {boolean} deprecated
             * @memberof google.protobuf.MethodOptions
             * @instance
             */
            MethodOptions.prototype.deprecated = false;

            /**
             * MethodOptions uninterpreted_option.
             * @member {Array.<google.protobuf.IUninterpretedOption>} uninterpreted_option
             * @memberof google.protobuf.MethodOptions
             * @instance
             */
            MethodOptions.prototype.uninterpreted_option = $util.emptyArray;

            /**
             * MethodOptions .google.api.http.
             * @member {google.api.IHttpRule|null|undefined} .google.api.http
             * @memberof google.protobuf.MethodOptions
             * @instance
             */
            MethodOptions.prototype[".google.api.http"] = null;

            /**
             * Encodes the specified MethodOptions message. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {google.protobuf.IMethodOptions} message MethodOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MethodOptions.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.deprecated != null && Object.hasOwnProperty.call(message, "deprecated"))
                    writer.uint32(/* id 33, wireType 0 =*/264).bool(message.deprecated);
                if (message.uninterpreted_option != null && message.uninterpreted_option.length)
                    for (let i = 0; i < message.uninterpreted_option.length; ++i)
                        $root.google.protobuf.UninterpretedOption.encode(message.uninterpreted_option[i], writer.uint32(/* id 999, wireType 2 =*/7994).fork()).ldelim();
                if (message[".google.api.http"] != null && Object.hasOwnProperty.call(message, ".google.api.http"))
                    $root.google.api.HttpRule.encode(message[".google.api.http"], writer.uint32(/* id 72295728, wireType 2 =*/578365826).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified MethodOptions message, length delimited. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {google.protobuf.IMethodOptions} message MethodOptions message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MethodOptions.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MethodOptions message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.MethodOptions} MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MethodOptions.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.MethodOptions();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 33:
                        message.deprecated = reader.bool();
                        break;
                    case 999:
                        if (!(message.uninterpreted_option && message.uninterpreted_option.length))
                            message.uninterpreted_option = [];
                        message.uninterpreted_option.push($root.google.protobuf.UninterpretedOption.decode(reader, reader.uint32()));
                        break;
                    case 72295728:
                        message[".google.api.http"] = $root.google.api.HttpRule.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MethodOptions message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.MethodOptions} MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MethodOptions.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MethodOptions message.
             * @function verify
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MethodOptions.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    if (typeof message.deprecated !== "boolean")
                        return "deprecated: boolean expected";
                if (message.uninterpreted_option != null && message.hasOwnProperty("uninterpreted_option")) {
                    if (!Array.isArray(message.uninterpreted_option))
                        return "uninterpreted_option: array expected";
                    for (let i = 0; i < message.uninterpreted_option.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.verify(message.uninterpreted_option[i]);
                        if (error)
                            return "uninterpreted_option." + error;
                    }
                }
                if (message[".google.api.http"] != null && message.hasOwnProperty(".google.api.http")) {
                    let error = $root.google.api.HttpRule.verify(message[".google.api.http"]);
                    if (error)
                        return ".google.api.http." + error;
                }
                return null;
            };

            /**
             * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.MethodOptions} MethodOptions
             */
            MethodOptions.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.MethodOptions)
                    return object;
                let message = new $root.google.protobuf.MethodOptions();
                if (object.deprecated != null)
                    message.deprecated = Boolean(object.deprecated);
                if (object.uninterpreted_option) {
                    if (!Array.isArray(object.uninterpreted_option))
                        throw TypeError(".google.protobuf.MethodOptions.uninterpreted_option: array expected");
                    message.uninterpreted_option = [];
                    for (let i = 0; i < object.uninterpreted_option.length; ++i) {
                        if (typeof object.uninterpreted_option[i] !== "object")
                            throw TypeError(".google.protobuf.MethodOptions.uninterpreted_option: object expected");
                        message.uninterpreted_option[i] = $root.google.protobuf.UninterpretedOption.fromObject(object.uninterpreted_option[i]);
                    }
                }
                if (object[".google.api.http"] != null) {
                    if (typeof object[".google.api.http"] !== "object")
                        throw TypeError(".google.protobuf.MethodOptions..google.api.http: object expected");
                    message[".google.api.http"] = $root.google.api.HttpRule.fromObject(object[".google.api.http"]);
                }
                return message;
            };

            /**
             * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.MethodOptions
             * @static
             * @param {google.protobuf.MethodOptions} message MethodOptions
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MethodOptions.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.uninterpreted_option = [];
                if (options.defaults) {
                    object.deprecated = false;
                    object[".google.api.http"] = null;
                }
                if (message.deprecated != null && message.hasOwnProperty("deprecated"))
                    object.deprecated = message.deprecated;
                if (message.uninterpreted_option && message.uninterpreted_option.length) {
                    object.uninterpreted_option = [];
                    for (let j = 0; j < message.uninterpreted_option.length; ++j)
                        object.uninterpreted_option[j] = $root.google.protobuf.UninterpretedOption.toObject(message.uninterpreted_option[j], options);
                }
                if (message[".google.api.http"] != null && message.hasOwnProperty(".google.api.http"))
                    object[".google.api.http"] = $root.google.api.HttpRule.toObject(message[".google.api.http"], options);
                return object;
            };

            /**
             * Converts this MethodOptions to JSON.
             * @function toJSON
             * @memberof google.protobuf.MethodOptions
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MethodOptions.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return MethodOptions;
        })();

        protobuf.UninterpretedOption = (function() {

            /**
             * Properties of an UninterpretedOption.
             * @memberof google.protobuf
             * @interface IUninterpretedOption
             * @property {Array.<google.protobuf.UninterpretedOption.INamePart>|null} [name] UninterpretedOption name
             * @property {string|null} [identifier_value] UninterpretedOption identifier_value
             * @property {Long|null} [positive_int_value] UninterpretedOption positive_int_value
             * @property {Long|null} [negative_int_value] UninterpretedOption negative_int_value
             * @property {number|null} [double_value] UninterpretedOption double_value
             * @property {Uint8Array|null} [string_value] UninterpretedOption string_value
             * @property {string|null} [aggregate_value] UninterpretedOption aggregate_value
             */

            /**
             * Constructs a new UninterpretedOption.
             * @memberof google.protobuf
             * @classdesc Represents an UninterpretedOption.
             * @implements IUninterpretedOption
             * @constructor
             * @param {google.protobuf.IUninterpretedOption=} [properties] Properties to set
             */
            function UninterpretedOption(properties) {
                this.name = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * UninterpretedOption name.
             * @member {Array.<google.protobuf.UninterpretedOption.INamePart>} name
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.name = $util.emptyArray;

            /**
             * UninterpretedOption identifier_value.
             * @member {string} identifier_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.identifier_value = "";

            /**
             * UninterpretedOption positive_int_value.
             * @member {Long} positive_int_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.positive_int_value = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * UninterpretedOption negative_int_value.
             * @member {Long} negative_int_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.negative_int_value = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * UninterpretedOption double_value.
             * @member {number} double_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.double_value = 0;

            /**
             * UninterpretedOption string_value.
             * @member {Uint8Array} string_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.string_value = $util.newBuffer([]);

            /**
             * UninterpretedOption aggregate_value.
             * @member {string} aggregate_value
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             */
            UninterpretedOption.prototype.aggregate_value = "";

            /**
             * Encodes the specified UninterpretedOption message. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {google.protobuf.IUninterpretedOption} message UninterpretedOption message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UninterpretedOption.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && message.name.length)
                    for (let i = 0; i < message.name.length; ++i)
                        $root.google.protobuf.UninterpretedOption.NamePart.encode(message.name[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.identifier_value != null && Object.hasOwnProperty.call(message, "identifier_value"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.identifier_value);
                if (message.positive_int_value != null && Object.hasOwnProperty.call(message, "positive_int_value"))
                    writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.positive_int_value);
                if (message.negative_int_value != null && Object.hasOwnProperty.call(message, "negative_int_value"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.negative_int_value);
                if (message.double_value != null && Object.hasOwnProperty.call(message, "double_value"))
                    writer.uint32(/* id 6, wireType 1 =*/49).double(message.double_value);
                if (message.string_value != null && Object.hasOwnProperty.call(message, "string_value"))
                    writer.uint32(/* id 7, wireType 2 =*/58).bytes(message.string_value);
                if (message.aggregate_value != null && Object.hasOwnProperty.call(message, "aggregate_value"))
                    writer.uint32(/* id 8, wireType 2 =*/66).string(message.aggregate_value);
                return writer;
            };

            /**
             * Encodes the specified UninterpretedOption message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {google.protobuf.IUninterpretedOption} message UninterpretedOption message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            UninterpretedOption.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.UninterpretedOption} UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UninterpretedOption.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.UninterpretedOption();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 2:
                        if (!(message.name && message.name.length))
                            message.name = [];
                        message.name.push($root.google.protobuf.UninterpretedOption.NamePart.decode(reader, reader.uint32()));
                        break;
                    case 3:
                        message.identifier_value = reader.string();
                        break;
                    case 4:
                        message.positive_int_value = reader.uint64();
                        break;
                    case 5:
                        message.negative_int_value = reader.int64();
                        break;
                    case 6:
                        message.double_value = reader.double();
                        break;
                    case 7:
                        message.string_value = reader.bytes();
                        break;
                    case 8:
                        message.aggregate_value = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.UninterpretedOption} UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            UninterpretedOption.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an UninterpretedOption message.
             * @function verify
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            UninterpretedOption.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name")) {
                    if (!Array.isArray(message.name))
                        return "name: array expected";
                    for (let i = 0; i < message.name.length; ++i) {
                        let error = $root.google.protobuf.UninterpretedOption.NamePart.verify(message.name[i]);
                        if (error)
                            return "name." + error;
                    }
                }
                if (message.identifier_value != null && message.hasOwnProperty("identifier_value"))
                    if (!$util.isString(message.identifier_value))
                        return "identifier_value: string expected";
                if (message.positive_int_value != null && message.hasOwnProperty("positive_int_value"))
                    if (!$util.isInteger(message.positive_int_value) && !(message.positive_int_value && $util.isInteger(message.positive_int_value.low) && $util.isInteger(message.positive_int_value.high)))
                        return "positive_int_value: integer|Long expected";
                if (message.negative_int_value != null && message.hasOwnProperty("negative_int_value"))
                    if (!$util.isInteger(message.negative_int_value) && !(message.negative_int_value && $util.isInteger(message.negative_int_value.low) && $util.isInteger(message.negative_int_value.high)))
                        return "negative_int_value: integer|Long expected";
                if (message.double_value != null && message.hasOwnProperty("double_value"))
                    if (typeof message.double_value !== "number")
                        return "double_value: number expected";
                if (message.string_value != null && message.hasOwnProperty("string_value"))
                    if (!(message.string_value && typeof message.string_value.length === "number" || $util.isString(message.string_value)))
                        return "string_value: buffer expected";
                if (message.aggregate_value != null && message.hasOwnProperty("aggregate_value"))
                    if (!$util.isString(message.aggregate_value))
                        return "aggregate_value: string expected";
                return null;
            };

            /**
             * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.UninterpretedOption} UninterpretedOption
             */
            UninterpretedOption.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.UninterpretedOption)
                    return object;
                let message = new $root.google.protobuf.UninterpretedOption();
                if (object.name) {
                    if (!Array.isArray(object.name))
                        throw TypeError(".google.protobuf.UninterpretedOption.name: array expected");
                    message.name = [];
                    for (let i = 0; i < object.name.length; ++i) {
                        if (typeof object.name[i] !== "object")
                            throw TypeError(".google.protobuf.UninterpretedOption.name: object expected");
                        message.name[i] = $root.google.protobuf.UninterpretedOption.NamePart.fromObject(object.name[i]);
                    }
                }
                if (object.identifier_value != null)
                    message.identifier_value = String(object.identifier_value);
                if (object.positive_int_value != null)
                    if ($util.Long)
                        (message.positive_int_value = $util.Long.fromValue(object.positive_int_value)).unsigned = true;
                    else if (typeof object.positive_int_value === "string")
                        message.positive_int_value = parseInt(object.positive_int_value, 10);
                    else if (typeof object.positive_int_value === "number")
                        message.positive_int_value = object.positive_int_value;
                    else if (typeof object.positive_int_value === "object")
                        message.positive_int_value = new $util.LongBits(object.positive_int_value.low >>> 0, object.positive_int_value.high >>> 0).toNumber(true);
                if (object.negative_int_value != null)
                    if ($util.Long)
                        (message.negative_int_value = $util.Long.fromValue(object.negative_int_value)).unsigned = false;
                    else if (typeof object.negative_int_value === "string")
                        message.negative_int_value = parseInt(object.negative_int_value, 10);
                    else if (typeof object.negative_int_value === "number")
                        message.negative_int_value = object.negative_int_value;
                    else if (typeof object.negative_int_value === "object")
                        message.negative_int_value = new $util.LongBits(object.negative_int_value.low >>> 0, object.negative_int_value.high >>> 0).toNumber();
                if (object.double_value != null)
                    message.double_value = Number(object.double_value);
                if (object.string_value != null)
                    if (typeof object.string_value === "string")
                        $util.base64.decode(object.string_value, message.string_value = $util.newBuffer($util.base64.length(object.string_value)), 0);
                    else if (object.string_value.length)
                        message.string_value = object.string_value;
                if (object.aggregate_value != null)
                    message.aggregate_value = String(object.aggregate_value);
                return message;
            };

            /**
             * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.UninterpretedOption
             * @static
             * @param {google.protobuf.UninterpretedOption} message UninterpretedOption
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            UninterpretedOption.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.name = [];
                if (options.defaults) {
                    object.identifier_value = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.positive_int_value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.positive_int_value = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.negative_int_value = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.negative_int_value = options.longs === String ? "0" : 0;
                    object.double_value = 0;
                    if (options.bytes === String)
                        object.string_value = "";
                    else {
                        object.string_value = [];
                        if (options.bytes !== Array)
                            object.string_value = $util.newBuffer(object.string_value);
                    }
                    object.aggregate_value = "";
                }
                if (message.name && message.name.length) {
                    object.name = [];
                    for (let j = 0; j < message.name.length; ++j)
                        object.name[j] = $root.google.protobuf.UninterpretedOption.NamePart.toObject(message.name[j], options);
                }
                if (message.identifier_value != null && message.hasOwnProperty("identifier_value"))
                    object.identifier_value = message.identifier_value;
                if (message.positive_int_value != null && message.hasOwnProperty("positive_int_value"))
                    if (typeof message.positive_int_value === "number")
                        object.positive_int_value = options.longs === String ? String(message.positive_int_value) : message.positive_int_value;
                    else
                        object.positive_int_value = options.longs === String ? $util.Long.prototype.toString.call(message.positive_int_value) : options.longs === Number ? new $util.LongBits(message.positive_int_value.low >>> 0, message.positive_int_value.high >>> 0).toNumber(true) : message.positive_int_value;
                if (message.negative_int_value != null && message.hasOwnProperty("negative_int_value"))
                    if (typeof message.negative_int_value === "number")
                        object.negative_int_value = options.longs === String ? String(message.negative_int_value) : message.negative_int_value;
                    else
                        object.negative_int_value = options.longs === String ? $util.Long.prototype.toString.call(message.negative_int_value) : options.longs === Number ? new $util.LongBits(message.negative_int_value.low >>> 0, message.negative_int_value.high >>> 0).toNumber() : message.negative_int_value;
                if (message.double_value != null && message.hasOwnProperty("double_value"))
                    object.double_value = options.json && !isFinite(message.double_value) ? String(message.double_value) : message.double_value;
                if (message.string_value != null && message.hasOwnProperty("string_value"))
                    object.string_value = options.bytes === String ? $util.base64.encode(message.string_value, 0, message.string_value.length) : options.bytes === Array ? Array.prototype.slice.call(message.string_value) : message.string_value;
                if (message.aggregate_value != null && message.hasOwnProperty("aggregate_value"))
                    object.aggregate_value = message.aggregate_value;
                return object;
            };

            /**
             * Converts this UninterpretedOption to JSON.
             * @function toJSON
             * @memberof google.protobuf.UninterpretedOption
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            UninterpretedOption.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            UninterpretedOption.NamePart = (function() {

                /**
                 * Properties of a NamePart.
                 * @memberof google.protobuf.UninterpretedOption
                 * @interface INamePart
                 * @property {string} name_part NamePart name_part
                 * @property {boolean} is_extension NamePart is_extension
                 */

                /**
                 * Constructs a new NamePart.
                 * @memberof google.protobuf.UninterpretedOption
                 * @classdesc Represents a NamePart.
                 * @implements INamePart
                 * @constructor
                 * @param {google.protobuf.UninterpretedOption.INamePart=} [properties] Properties to set
                 */
                function NamePart(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * NamePart name_part.
                 * @member {string} name_part
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @instance
                 */
                NamePart.prototype.name_part = "";

                /**
                 * NamePart is_extension.
                 * @member {boolean} is_extension
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @instance
                 */
                NamePart.prototype.is_extension = false;

                /**
                 * Encodes the specified NamePart message. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @function encode
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {google.protobuf.UninterpretedOption.INamePart} message NamePart message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                NamePart.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name_part);
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.is_extension);
                    return writer;
                };

                /**
                 * Encodes the specified NamePart message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {google.protobuf.UninterpretedOption.INamePart} message NamePart message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                NamePart.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a NamePart message from the specified reader or buffer.
                 * @function decode
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {google.protobuf.UninterpretedOption.NamePart} NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                NamePart.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.UninterpretedOption.NamePart();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.name_part = reader.string();
                            break;
                        case 2:
                            message.is_extension = reader.bool();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    if (!message.hasOwnProperty("name_part"))
                        throw $util.ProtocolError("missing required 'name_part'", { instance: message });
                    if (!message.hasOwnProperty("is_extension"))
                        throw $util.ProtocolError("missing required 'is_extension'", { instance: message });
                    return message;
                };

                /**
                 * Decodes a NamePart message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {google.protobuf.UninterpretedOption.NamePart} NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                NamePart.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a NamePart message.
                 * @function verify
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                NamePart.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (!$util.isString(message.name_part))
                        return "name_part: string expected";
                    if (typeof message.is_extension !== "boolean")
                        return "is_extension: boolean expected";
                    return null;
                };

                /**
                 * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.UninterpretedOption.NamePart} NamePart
                 */
                NamePart.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.UninterpretedOption.NamePart)
                        return object;
                    let message = new $root.google.protobuf.UninterpretedOption.NamePart();
                    if (object.name_part != null)
                        message.name_part = String(object.name_part);
                    if (object.is_extension != null)
                        message.is_extension = Boolean(object.is_extension);
                    return message;
                };

                /**
                 * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @static
                 * @param {google.protobuf.UninterpretedOption.NamePart} message NamePart
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                NamePart.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.name_part = "";
                        object.is_extension = false;
                    }
                    if (message.name_part != null && message.hasOwnProperty("name_part"))
                        object.name_part = message.name_part;
                    if (message.is_extension != null && message.hasOwnProperty("is_extension"))
                        object.is_extension = message.is_extension;
                    return object;
                };

                /**
                 * Converts this NamePart to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.UninterpretedOption.NamePart
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                NamePart.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return NamePart;
            })();

            return UninterpretedOption;
        })();

        protobuf.SourceCodeInfo = (function() {

            /**
             * Properties of a SourceCodeInfo.
             * @memberof google.protobuf
             * @interface ISourceCodeInfo
             * @property {Array.<google.protobuf.SourceCodeInfo.ILocation>|null} [location] SourceCodeInfo location
             */

            /**
             * Constructs a new SourceCodeInfo.
             * @memberof google.protobuf
             * @classdesc Represents a SourceCodeInfo.
             * @implements ISourceCodeInfo
             * @constructor
             * @param {google.protobuf.ISourceCodeInfo=} [properties] Properties to set
             */
            function SourceCodeInfo(properties) {
                this.location = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SourceCodeInfo location.
             * @member {Array.<google.protobuf.SourceCodeInfo.ILocation>} location
             * @memberof google.protobuf.SourceCodeInfo
             * @instance
             */
            SourceCodeInfo.prototype.location = $util.emptyArray;

            /**
             * Encodes the specified SourceCodeInfo message. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {google.protobuf.ISourceCodeInfo} message SourceCodeInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SourceCodeInfo.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.location != null && message.location.length)
                    for (let i = 0; i < message.location.length; ++i)
                        $root.google.protobuf.SourceCodeInfo.Location.encode(message.location[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified SourceCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {google.protobuf.ISourceCodeInfo} message SourceCodeInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SourceCodeInfo.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.SourceCodeInfo} SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SourceCodeInfo.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.SourceCodeInfo();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.location && message.location.length))
                            message.location = [];
                        message.location.push($root.google.protobuf.SourceCodeInfo.Location.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.SourceCodeInfo} SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SourceCodeInfo.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SourceCodeInfo message.
             * @function verify
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SourceCodeInfo.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.location != null && message.hasOwnProperty("location")) {
                    if (!Array.isArray(message.location))
                        return "location: array expected";
                    for (let i = 0; i < message.location.length; ++i) {
                        let error = $root.google.protobuf.SourceCodeInfo.Location.verify(message.location[i]);
                        if (error)
                            return "location." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.SourceCodeInfo} SourceCodeInfo
             */
            SourceCodeInfo.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.SourceCodeInfo)
                    return object;
                let message = new $root.google.protobuf.SourceCodeInfo();
                if (object.location) {
                    if (!Array.isArray(object.location))
                        throw TypeError(".google.protobuf.SourceCodeInfo.location: array expected");
                    message.location = [];
                    for (let i = 0; i < object.location.length; ++i) {
                        if (typeof object.location[i] !== "object")
                            throw TypeError(".google.protobuf.SourceCodeInfo.location: object expected");
                        message.location[i] = $root.google.protobuf.SourceCodeInfo.Location.fromObject(object.location[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.SourceCodeInfo
             * @static
             * @param {google.protobuf.SourceCodeInfo} message SourceCodeInfo
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SourceCodeInfo.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.location = [];
                if (message.location && message.location.length) {
                    object.location = [];
                    for (let j = 0; j < message.location.length; ++j)
                        object.location[j] = $root.google.protobuf.SourceCodeInfo.Location.toObject(message.location[j], options);
                }
                return object;
            };

            /**
             * Converts this SourceCodeInfo to JSON.
             * @function toJSON
             * @memberof google.protobuf.SourceCodeInfo
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SourceCodeInfo.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            SourceCodeInfo.Location = (function() {

                /**
                 * Properties of a Location.
                 * @memberof google.protobuf.SourceCodeInfo
                 * @interface ILocation
                 * @property {Array.<number>|null} [path] Location path
                 * @property {Array.<number>|null} [span] Location span
                 * @property {string|null} [leading_comments] Location leading_comments
                 * @property {string|null} [trailing_comments] Location trailing_comments
                 * @property {Array.<string>|null} [leading_detached_comments] Location leading_detached_comments
                 */

                /**
                 * Constructs a new Location.
                 * @memberof google.protobuf.SourceCodeInfo
                 * @classdesc Represents a Location.
                 * @implements ILocation
                 * @constructor
                 * @param {google.protobuf.SourceCodeInfo.ILocation=} [properties] Properties to set
                 */
                function Location(properties) {
                    this.path = [];
                    this.span = [];
                    this.leading_detached_comments = [];
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Location path.
                 * @member {Array.<number>} path
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 */
                Location.prototype.path = $util.emptyArray;

                /**
                 * Location span.
                 * @member {Array.<number>} span
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 */
                Location.prototype.span = $util.emptyArray;

                /**
                 * Location leading_comments.
                 * @member {string} leading_comments
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 */
                Location.prototype.leading_comments = "";

                /**
                 * Location trailing_comments.
                 * @member {string} trailing_comments
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 */
                Location.prototype.trailing_comments = "";

                /**
                 * Location leading_detached_comments.
                 * @member {Array.<string>} leading_detached_comments
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 */
                Location.prototype.leading_detached_comments = $util.emptyArray;

                /**
                 * Encodes the specified Location message. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @function encode
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {google.protobuf.SourceCodeInfo.ILocation} message Location message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Location.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.path != null && message.path.length) {
                        writer.uint32(/* id 1, wireType 2 =*/10).fork();
                        for (let i = 0; i < message.path.length; ++i)
                            writer.int32(message.path[i]);
                        writer.ldelim();
                    }
                    if (message.span != null && message.span.length) {
                        writer.uint32(/* id 2, wireType 2 =*/18).fork();
                        for (let i = 0; i < message.span.length; ++i)
                            writer.int32(message.span[i]);
                        writer.ldelim();
                    }
                    if (message.leading_comments != null && Object.hasOwnProperty.call(message, "leading_comments"))
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.leading_comments);
                    if (message.trailing_comments != null && Object.hasOwnProperty.call(message, "trailing_comments"))
                        writer.uint32(/* id 4, wireType 2 =*/34).string(message.trailing_comments);
                    if (message.leading_detached_comments != null && message.leading_detached_comments.length)
                        for (let i = 0; i < message.leading_detached_comments.length; ++i)
                            writer.uint32(/* id 6, wireType 2 =*/50).string(message.leading_detached_comments[i]);
                    return writer;
                };

                /**
                 * Encodes the specified Location message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {google.protobuf.SourceCodeInfo.ILocation} message Location message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Location.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Location message from the specified reader or buffer.
                 * @function decode
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {google.protobuf.SourceCodeInfo.Location} Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Location.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.SourceCodeInfo.Location();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            if (!(message.path && message.path.length))
                                message.path = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                while (reader.pos < end2)
                                    message.path.push(reader.int32());
                            } else
                                message.path.push(reader.int32());
                            break;
                        case 2:
                            if (!(message.span && message.span.length))
                                message.span = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                while (reader.pos < end2)
                                    message.span.push(reader.int32());
                            } else
                                message.span.push(reader.int32());
                            break;
                        case 3:
                            message.leading_comments = reader.string();
                            break;
                        case 4:
                            message.trailing_comments = reader.string();
                            break;
                        case 6:
                            if (!(message.leading_detached_comments && message.leading_detached_comments.length))
                                message.leading_detached_comments = [];
                            message.leading_detached_comments.push(reader.string());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Location message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {google.protobuf.SourceCodeInfo.Location} Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Location.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Location message.
                 * @function verify
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Location.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.path != null && message.hasOwnProperty("path")) {
                        if (!Array.isArray(message.path))
                            return "path: array expected";
                        for (let i = 0; i < message.path.length; ++i)
                            if (!$util.isInteger(message.path[i]))
                                return "path: integer[] expected";
                    }
                    if (message.span != null && message.hasOwnProperty("span")) {
                        if (!Array.isArray(message.span))
                            return "span: array expected";
                        for (let i = 0; i < message.span.length; ++i)
                            if (!$util.isInteger(message.span[i]))
                                return "span: integer[] expected";
                    }
                    if (message.leading_comments != null && message.hasOwnProperty("leading_comments"))
                        if (!$util.isString(message.leading_comments))
                            return "leading_comments: string expected";
                    if (message.trailing_comments != null && message.hasOwnProperty("trailing_comments"))
                        if (!$util.isString(message.trailing_comments))
                            return "trailing_comments: string expected";
                    if (message.leading_detached_comments != null && message.hasOwnProperty("leading_detached_comments")) {
                        if (!Array.isArray(message.leading_detached_comments))
                            return "leading_detached_comments: array expected";
                        for (let i = 0; i < message.leading_detached_comments.length; ++i)
                            if (!$util.isString(message.leading_detached_comments[i]))
                                return "leading_detached_comments: string[] expected";
                    }
                    return null;
                };

                /**
                 * Creates a Location message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.SourceCodeInfo.Location} Location
                 */
                Location.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.SourceCodeInfo.Location)
                        return object;
                    let message = new $root.google.protobuf.SourceCodeInfo.Location();
                    if (object.path) {
                        if (!Array.isArray(object.path))
                            throw TypeError(".google.protobuf.SourceCodeInfo.Location.path: array expected");
                        message.path = [];
                        for (let i = 0; i < object.path.length; ++i)
                            message.path[i] = object.path[i] | 0;
                    }
                    if (object.span) {
                        if (!Array.isArray(object.span))
                            throw TypeError(".google.protobuf.SourceCodeInfo.Location.span: array expected");
                        message.span = [];
                        for (let i = 0; i < object.span.length; ++i)
                            message.span[i] = object.span[i] | 0;
                    }
                    if (object.leading_comments != null)
                        message.leading_comments = String(object.leading_comments);
                    if (object.trailing_comments != null)
                        message.trailing_comments = String(object.trailing_comments);
                    if (object.leading_detached_comments) {
                        if (!Array.isArray(object.leading_detached_comments))
                            throw TypeError(".google.protobuf.SourceCodeInfo.Location.leading_detached_comments: array expected");
                        message.leading_detached_comments = [];
                        for (let i = 0; i < object.leading_detached_comments.length; ++i)
                            message.leading_detached_comments[i] = String(object.leading_detached_comments[i]);
                    }
                    return message;
                };

                /**
                 * Creates a plain object from a Location message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @static
                 * @param {google.protobuf.SourceCodeInfo.Location} message Location
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Location.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.arrays || options.defaults) {
                        object.path = [];
                        object.span = [];
                        object.leading_detached_comments = [];
                    }
                    if (options.defaults) {
                        object.leading_comments = "";
                        object.trailing_comments = "";
                    }
                    if (message.path && message.path.length) {
                        object.path = [];
                        for (let j = 0; j < message.path.length; ++j)
                            object.path[j] = message.path[j];
                    }
                    if (message.span && message.span.length) {
                        object.span = [];
                        for (let j = 0; j < message.span.length; ++j)
                            object.span[j] = message.span[j];
                    }
                    if (message.leading_comments != null && message.hasOwnProperty("leading_comments"))
                        object.leading_comments = message.leading_comments;
                    if (message.trailing_comments != null && message.hasOwnProperty("trailing_comments"))
                        object.trailing_comments = message.trailing_comments;
                    if (message.leading_detached_comments && message.leading_detached_comments.length) {
                        object.leading_detached_comments = [];
                        for (let j = 0; j < message.leading_detached_comments.length; ++j)
                            object.leading_detached_comments[j] = message.leading_detached_comments[j];
                    }
                    return object;
                };

                /**
                 * Converts this Location to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.SourceCodeInfo.Location
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Location.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Location;
            })();

            return SourceCodeInfo;
        })();

        protobuf.GeneratedCodeInfo = (function() {

            /**
             * Properties of a GeneratedCodeInfo.
             * @memberof google.protobuf
             * @interface IGeneratedCodeInfo
             * @property {Array.<google.protobuf.GeneratedCodeInfo.IAnnotation>|null} [annotation] GeneratedCodeInfo annotation
             */

            /**
             * Constructs a new GeneratedCodeInfo.
             * @memberof google.protobuf
             * @classdesc Represents a GeneratedCodeInfo.
             * @implements IGeneratedCodeInfo
             * @constructor
             * @param {google.protobuf.IGeneratedCodeInfo=} [properties] Properties to set
             */
            function GeneratedCodeInfo(properties) {
                this.annotation = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GeneratedCodeInfo annotation.
             * @member {Array.<google.protobuf.GeneratedCodeInfo.IAnnotation>} annotation
             * @memberof google.protobuf.GeneratedCodeInfo
             * @instance
             */
            GeneratedCodeInfo.prototype.annotation = $util.emptyArray;

            /**
             * Encodes the specified GeneratedCodeInfo message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @function encode
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {google.protobuf.IGeneratedCodeInfo} message GeneratedCodeInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GeneratedCodeInfo.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.annotation != null && message.annotation.length)
                    for (let i = 0; i < message.annotation.length; ++i)
                        $root.google.protobuf.GeneratedCodeInfo.Annotation.encode(message.annotation[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified GeneratedCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {google.protobuf.IGeneratedCodeInfo} message GeneratedCodeInfo message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GeneratedCodeInfo.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer.
             * @function decode
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.protobuf.GeneratedCodeInfo} GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GeneratedCodeInfo.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.GeneratedCodeInfo();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.annotation && message.annotation.length))
                            message.annotation = [];
                        message.annotation.push($root.google.protobuf.GeneratedCodeInfo.Annotation.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.protobuf.GeneratedCodeInfo} GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GeneratedCodeInfo.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GeneratedCodeInfo message.
             * @function verify
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GeneratedCodeInfo.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.annotation != null && message.hasOwnProperty("annotation")) {
                    if (!Array.isArray(message.annotation))
                        return "annotation: array expected";
                    for (let i = 0; i < message.annotation.length; ++i) {
                        let error = $root.google.protobuf.GeneratedCodeInfo.Annotation.verify(message.annotation[i]);
                        if (error)
                            return "annotation." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.protobuf.GeneratedCodeInfo} GeneratedCodeInfo
             */
            GeneratedCodeInfo.fromObject = function fromObject(object) {
                if (object instanceof $root.google.protobuf.GeneratedCodeInfo)
                    return object;
                let message = new $root.google.protobuf.GeneratedCodeInfo();
                if (object.annotation) {
                    if (!Array.isArray(object.annotation))
                        throw TypeError(".google.protobuf.GeneratedCodeInfo.annotation: array expected");
                    message.annotation = [];
                    for (let i = 0; i < object.annotation.length; ++i) {
                        if (typeof object.annotation[i] !== "object")
                            throw TypeError(".google.protobuf.GeneratedCodeInfo.annotation: object expected");
                        message.annotation[i] = $root.google.protobuf.GeneratedCodeInfo.Annotation.fromObject(object.annotation[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.protobuf.GeneratedCodeInfo
             * @static
             * @param {google.protobuf.GeneratedCodeInfo} message GeneratedCodeInfo
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GeneratedCodeInfo.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.annotation = [];
                if (message.annotation && message.annotation.length) {
                    object.annotation = [];
                    for (let j = 0; j < message.annotation.length; ++j)
                        object.annotation[j] = $root.google.protobuf.GeneratedCodeInfo.Annotation.toObject(message.annotation[j], options);
                }
                return object;
            };

            /**
             * Converts this GeneratedCodeInfo to JSON.
             * @function toJSON
             * @memberof google.protobuf.GeneratedCodeInfo
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GeneratedCodeInfo.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            GeneratedCodeInfo.Annotation = (function() {

                /**
                 * Properties of an Annotation.
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @interface IAnnotation
                 * @property {Array.<number>|null} [path] Annotation path
                 * @property {string|null} [source_file] Annotation source_file
                 * @property {number|null} [begin] Annotation begin
                 * @property {number|null} [end] Annotation end
                 */

                /**
                 * Constructs a new Annotation.
                 * @memberof google.protobuf.GeneratedCodeInfo
                 * @classdesc Represents an Annotation.
                 * @implements IAnnotation
                 * @constructor
                 * @param {google.protobuf.GeneratedCodeInfo.IAnnotation=} [properties] Properties to set
                 */
                function Annotation(properties) {
                    this.path = [];
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Annotation path.
                 * @member {Array.<number>} path
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @instance
                 */
                Annotation.prototype.path = $util.emptyArray;

                /**
                 * Annotation source_file.
                 * @member {string} source_file
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @instance
                 */
                Annotation.prototype.source_file = "";

                /**
                 * Annotation begin.
                 * @member {number} begin
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @instance
                 */
                Annotation.prototype.begin = 0;

                /**
                 * Annotation end.
                 * @member {number} end
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @instance
                 */
                Annotation.prototype.end = 0;

                /**
                 * Encodes the specified Annotation message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @function encode
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {google.protobuf.GeneratedCodeInfo.IAnnotation} message Annotation message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Annotation.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.path != null && message.path.length) {
                        writer.uint32(/* id 1, wireType 2 =*/10).fork();
                        for (let i = 0; i < message.path.length; ++i)
                            writer.int32(message.path[i]);
                        writer.ldelim();
                    }
                    if (message.source_file != null && Object.hasOwnProperty.call(message, "source_file"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.source_file);
                    if (message.begin != null && Object.hasOwnProperty.call(message, "begin"))
                        writer.uint32(/* id 3, wireType 0 =*/24).int32(message.begin);
                    if (message.end != null && Object.hasOwnProperty.call(message, "end"))
                        writer.uint32(/* id 4, wireType 0 =*/32).int32(message.end);
                    return writer;
                };

                /**
                 * Encodes the specified Annotation message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {google.protobuf.GeneratedCodeInfo.IAnnotation} message Annotation message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Annotation.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an Annotation message from the specified reader or buffer.
                 * @function decode
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {google.protobuf.GeneratedCodeInfo.Annotation} Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Annotation.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.protobuf.GeneratedCodeInfo.Annotation();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            if (!(message.path && message.path.length))
                                message.path = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                while (reader.pos < end2)
                                    message.path.push(reader.int32());
                            } else
                                message.path.push(reader.int32());
                            break;
                        case 2:
                            message.source_file = reader.string();
                            break;
                        case 3:
                            message.begin = reader.int32();
                            break;
                        case 4:
                            message.end = reader.int32();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes an Annotation message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {google.protobuf.GeneratedCodeInfo.Annotation} Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Annotation.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies an Annotation message.
                 * @function verify
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Annotation.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.path != null && message.hasOwnProperty("path")) {
                        if (!Array.isArray(message.path))
                            return "path: array expected";
                        for (let i = 0; i < message.path.length; ++i)
                            if (!$util.isInteger(message.path[i]))
                                return "path: integer[] expected";
                    }
                    if (message.source_file != null && message.hasOwnProperty("source_file"))
                        if (!$util.isString(message.source_file))
                            return "source_file: string expected";
                    if (message.begin != null && message.hasOwnProperty("begin"))
                        if (!$util.isInteger(message.begin))
                            return "begin: integer expected";
                    if (message.end != null && message.hasOwnProperty("end"))
                        if (!$util.isInteger(message.end))
                            return "end: integer expected";
                    return null;
                };

                /**
                 * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {google.protobuf.GeneratedCodeInfo.Annotation} Annotation
                 */
                Annotation.fromObject = function fromObject(object) {
                    if (object instanceof $root.google.protobuf.GeneratedCodeInfo.Annotation)
                        return object;
                    let message = new $root.google.protobuf.GeneratedCodeInfo.Annotation();
                    if (object.path) {
                        if (!Array.isArray(object.path))
                            throw TypeError(".google.protobuf.GeneratedCodeInfo.Annotation.path: array expected");
                        message.path = [];
                        for (let i = 0; i < object.path.length; ++i)
                            message.path[i] = object.path[i] | 0;
                    }
                    if (object.source_file != null)
                        message.source_file = String(object.source_file);
                    if (object.begin != null)
                        message.begin = object.begin | 0;
                    if (object.end != null)
                        message.end = object.end | 0;
                    return message;
                };

                /**
                 * Creates a plain object from an Annotation message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @static
                 * @param {google.protobuf.GeneratedCodeInfo.Annotation} message Annotation
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Annotation.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.arrays || options.defaults)
                        object.path = [];
                    if (options.defaults) {
                        object.source_file = "";
                        object.begin = 0;
                        object.end = 0;
                    }
                    if (message.path && message.path.length) {
                        object.path = [];
                        for (let j = 0; j < message.path.length; ++j)
                            object.path[j] = message.path[j];
                    }
                    if (message.source_file != null && message.hasOwnProperty("source_file"))
                        object.source_file = message.source_file;
                    if (message.begin != null && message.hasOwnProperty("begin"))
                        object.begin = message.begin;
                    if (message.end != null && message.hasOwnProperty("end"))
                        object.end = message.end;
                    return object;
                };

                /**
                 * Converts this Annotation to JSON.
                 * @function toJSON
                 * @memberof google.protobuf.GeneratedCodeInfo.Annotation
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Annotation.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Annotation;
            })();

            return GeneratedCodeInfo;
        })();

        return protobuf;
    })();

    google.api = (function() {

        /**
         * Namespace api.
         * @memberof google
         * @namespace
         */
        const api = {};

        api.Http = (function() {

            /**
             * Properties of a Http.
             * @memberof google.api
             * @interface IHttp
             * @property {Array.<google.api.IHttpRule>|null} [rules] Http rules
             * @property {boolean|null} [fully_decode_reserved_expansion] Http fully_decode_reserved_expansion
             */

            /**
             * Constructs a new Http.
             * @memberof google.api
             * @classdesc Represents a Http.
             * @implements IHttp
             * @constructor
             * @param {google.api.IHttp=} [properties] Properties to set
             */
            function Http(properties) {
                this.rules = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Http rules.
             * @member {Array.<google.api.IHttpRule>} rules
             * @memberof google.api.Http
             * @instance
             */
            Http.prototype.rules = $util.emptyArray;

            /**
             * Http fully_decode_reserved_expansion.
             * @member {boolean} fully_decode_reserved_expansion
             * @memberof google.api.Http
             * @instance
             */
            Http.prototype.fully_decode_reserved_expansion = false;

            /**
             * Encodes the specified Http message. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @function encode
             * @memberof google.api.Http
             * @static
             * @param {google.api.IHttp} message Http message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Http.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.rules != null && message.rules.length)
                    for (let i = 0; i < message.rules.length; ++i)
                        $root.google.api.HttpRule.encode(message.rules[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.fully_decode_reserved_expansion != null && Object.hasOwnProperty.call(message, "fully_decode_reserved_expansion"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.fully_decode_reserved_expansion);
                return writer;
            };

            /**
             * Encodes the specified Http message, length delimited. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.api.Http
             * @static
             * @param {google.api.IHttp} message Http message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Http.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Http message from the specified reader or buffer.
             * @function decode
             * @memberof google.api.Http
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.api.Http} Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Http.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.api.Http();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.rules && message.rules.length))
                            message.rules = [];
                        message.rules.push($root.google.api.HttpRule.decode(reader, reader.uint32()));
                        break;
                    case 2:
                        message.fully_decode_reserved_expansion = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Http message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.api.Http
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.api.Http} Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Http.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Http message.
             * @function verify
             * @memberof google.api.Http
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Http.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.rules != null && message.hasOwnProperty("rules")) {
                    if (!Array.isArray(message.rules))
                        return "rules: array expected";
                    for (let i = 0; i < message.rules.length; ++i) {
                        let error = $root.google.api.HttpRule.verify(message.rules[i]);
                        if (error)
                            return "rules." + error;
                    }
                }
                if (message.fully_decode_reserved_expansion != null && message.hasOwnProperty("fully_decode_reserved_expansion"))
                    if (typeof message.fully_decode_reserved_expansion !== "boolean")
                        return "fully_decode_reserved_expansion: boolean expected";
                return null;
            };

            /**
             * Creates a Http message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.api.Http
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.api.Http} Http
             */
            Http.fromObject = function fromObject(object) {
                if (object instanceof $root.google.api.Http)
                    return object;
                let message = new $root.google.api.Http();
                if (object.rules) {
                    if (!Array.isArray(object.rules))
                        throw TypeError(".google.api.Http.rules: array expected");
                    message.rules = [];
                    for (let i = 0; i < object.rules.length; ++i) {
                        if (typeof object.rules[i] !== "object")
                            throw TypeError(".google.api.Http.rules: object expected");
                        message.rules[i] = $root.google.api.HttpRule.fromObject(object.rules[i]);
                    }
                }
                if (object.fully_decode_reserved_expansion != null)
                    message.fully_decode_reserved_expansion = Boolean(object.fully_decode_reserved_expansion);
                return message;
            };

            /**
             * Creates a plain object from a Http message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.api.Http
             * @static
             * @param {google.api.Http} message Http
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Http.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.rules = [];
                if (options.defaults)
                    object.fully_decode_reserved_expansion = false;
                if (message.rules && message.rules.length) {
                    object.rules = [];
                    for (let j = 0; j < message.rules.length; ++j)
                        object.rules[j] = $root.google.api.HttpRule.toObject(message.rules[j], options);
                }
                if (message.fully_decode_reserved_expansion != null && message.hasOwnProperty("fully_decode_reserved_expansion"))
                    object.fully_decode_reserved_expansion = message.fully_decode_reserved_expansion;
                return object;
            };

            /**
             * Converts this Http to JSON.
             * @function toJSON
             * @memberof google.api.Http
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Http.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Http;
        })();

        api.HttpRule = (function() {

            /**
             * Properties of a HttpRule.
             * @memberof google.api
             * @interface IHttpRule
             * @property {string|null} [selector] HttpRule selector
             * @property {string|null} [get] HttpRule get
             * @property {string|null} [put] HttpRule put
             * @property {string|null} [post] HttpRule post
             * @property {string|null} ["delete"] HttpRule delete
             * @property {string|null} [patch] HttpRule patch
             * @property {google.api.ICustomHttpPattern|null} [custom] HttpRule custom
             * @property {string|null} [body] HttpRule body
             * @property {string|null} [response_body] HttpRule response_body
             * @property {Array.<google.api.IHttpRule>|null} [additional_bindings] HttpRule additional_bindings
             */

            /**
             * Constructs a new HttpRule.
             * @memberof google.api
             * @classdesc Represents a HttpRule.
             * @implements IHttpRule
             * @constructor
             * @param {google.api.IHttpRule=} [properties] Properties to set
             */
            function HttpRule(properties) {
                this.additional_bindings = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HttpRule selector.
             * @member {string} selector
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.selector = "";

            /**
             * HttpRule get.
             * @member {string|null|undefined} get
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.get = null;

            /**
             * HttpRule put.
             * @member {string|null|undefined} put
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.put = null;

            /**
             * HttpRule post.
             * @member {string|null|undefined} post
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.post = null;

            /**
             * HttpRule delete.
             * @member {string|null|undefined} delete
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype["delete"] = null;

            /**
             * HttpRule patch.
             * @member {string|null|undefined} patch
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.patch = null;

            /**
             * HttpRule custom.
             * @member {google.api.ICustomHttpPattern|null|undefined} custom
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.custom = null;

            /**
             * HttpRule body.
             * @member {string} body
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.body = "";

            /**
             * HttpRule response_body.
             * @member {string} response_body
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.response_body = "";

            /**
             * HttpRule additional_bindings.
             * @member {Array.<google.api.IHttpRule>} additional_bindings
             * @memberof google.api.HttpRule
             * @instance
             */
            HttpRule.prototype.additional_bindings = $util.emptyArray;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * HttpRule pattern.
             * @member {"get"|"put"|"post"|"delete"|"patch"|"custom"|undefined} pattern
             * @memberof google.api.HttpRule
             * @instance
             */
            Object.defineProperty(HttpRule.prototype, "pattern", {
                get: $util.oneOfGetter($oneOfFields = ["get", "put", "post", "delete", "patch", "custom"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Encodes the specified HttpRule message. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @function encode
             * @memberof google.api.HttpRule
             * @static
             * @param {google.api.IHttpRule} message HttpRule message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HttpRule.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.selector != null && Object.hasOwnProperty.call(message, "selector"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.selector);
                if (message.get != null && Object.hasOwnProperty.call(message, "get"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.get);
                if (message.put != null && Object.hasOwnProperty.call(message, "put"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.put);
                if (message.post != null && Object.hasOwnProperty.call(message, "post"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.post);
                if (message["delete"] != null && Object.hasOwnProperty.call(message, "delete"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message["delete"]);
                if (message.patch != null && Object.hasOwnProperty.call(message, "patch"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.patch);
                if (message.body != null && Object.hasOwnProperty.call(message, "body"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.body);
                if (message.custom != null && Object.hasOwnProperty.call(message, "custom"))
                    $root.google.api.CustomHttpPattern.encode(message.custom, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.additional_bindings != null && message.additional_bindings.length)
                    for (let i = 0; i < message.additional_bindings.length; ++i)
                        $root.google.api.HttpRule.encode(message.additional_bindings[i], writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
                if (message.response_body != null && Object.hasOwnProperty.call(message, "response_body"))
                    writer.uint32(/* id 12, wireType 2 =*/98).string(message.response_body);
                return writer;
            };

            /**
             * Encodes the specified HttpRule message, length delimited. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.api.HttpRule
             * @static
             * @param {google.api.IHttpRule} message HttpRule message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HttpRule.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HttpRule message from the specified reader or buffer.
             * @function decode
             * @memberof google.api.HttpRule
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.api.HttpRule} HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HttpRule.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.api.HttpRule();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.selector = reader.string();
                        break;
                    case 2:
                        message.get = reader.string();
                        break;
                    case 3:
                        message.put = reader.string();
                        break;
                    case 4:
                        message.post = reader.string();
                        break;
                    case 5:
                        message["delete"] = reader.string();
                        break;
                    case 6:
                        message.patch = reader.string();
                        break;
                    case 8:
                        message.custom = $root.google.api.CustomHttpPattern.decode(reader, reader.uint32());
                        break;
                    case 7:
                        message.body = reader.string();
                        break;
                    case 12:
                        message.response_body = reader.string();
                        break;
                    case 11:
                        if (!(message.additional_bindings && message.additional_bindings.length))
                            message.additional_bindings = [];
                        message.additional_bindings.push($root.google.api.HttpRule.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a HttpRule message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.api.HttpRule
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.api.HttpRule} HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HttpRule.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HttpRule message.
             * @function verify
             * @memberof google.api.HttpRule
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HttpRule.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                let properties = {};
                if (message.selector != null && message.hasOwnProperty("selector"))
                    if (!$util.isString(message.selector))
                        return "selector: string expected";
                if (message.get != null && message.hasOwnProperty("get")) {
                    properties.pattern = 1;
                    if (!$util.isString(message.get))
                        return "get: string expected";
                }
                if (message.put != null && message.hasOwnProperty("put")) {
                    if (properties.pattern === 1)
                        return "pattern: multiple values";
                    properties.pattern = 1;
                    if (!$util.isString(message.put))
                        return "put: string expected";
                }
                if (message.post != null && message.hasOwnProperty("post")) {
                    if (properties.pattern === 1)
                        return "pattern: multiple values";
                    properties.pattern = 1;
                    if (!$util.isString(message.post))
                        return "post: string expected";
                }
                if (message["delete"] != null && message.hasOwnProperty("delete")) {
                    if (properties.pattern === 1)
                        return "pattern: multiple values";
                    properties.pattern = 1;
                    if (!$util.isString(message["delete"]))
                        return "delete: string expected";
                }
                if (message.patch != null && message.hasOwnProperty("patch")) {
                    if (properties.pattern === 1)
                        return "pattern: multiple values";
                    properties.pattern = 1;
                    if (!$util.isString(message.patch))
                        return "patch: string expected";
                }
                if (message.custom != null && message.hasOwnProperty("custom")) {
                    if (properties.pattern === 1)
                        return "pattern: multiple values";
                    properties.pattern = 1;
                    {
                        let error = $root.google.api.CustomHttpPattern.verify(message.custom);
                        if (error)
                            return "custom." + error;
                    }
                }
                if (message.body != null && message.hasOwnProperty("body"))
                    if (!$util.isString(message.body))
                        return "body: string expected";
                if (message.response_body != null && message.hasOwnProperty("response_body"))
                    if (!$util.isString(message.response_body))
                        return "response_body: string expected";
                if (message.additional_bindings != null && message.hasOwnProperty("additional_bindings")) {
                    if (!Array.isArray(message.additional_bindings))
                        return "additional_bindings: array expected";
                    for (let i = 0; i < message.additional_bindings.length; ++i) {
                        let error = $root.google.api.HttpRule.verify(message.additional_bindings[i]);
                        if (error)
                            return "additional_bindings." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a HttpRule message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.api.HttpRule
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.api.HttpRule} HttpRule
             */
            HttpRule.fromObject = function fromObject(object) {
                if (object instanceof $root.google.api.HttpRule)
                    return object;
                let message = new $root.google.api.HttpRule();
                if (object.selector != null)
                    message.selector = String(object.selector);
                if (object.get != null)
                    message.get = String(object.get);
                if (object.put != null)
                    message.put = String(object.put);
                if (object.post != null)
                    message.post = String(object.post);
                if (object["delete"] != null)
                    message["delete"] = String(object["delete"]);
                if (object.patch != null)
                    message.patch = String(object.patch);
                if (object.custom != null) {
                    if (typeof object.custom !== "object")
                        throw TypeError(".google.api.HttpRule.custom: object expected");
                    message.custom = $root.google.api.CustomHttpPattern.fromObject(object.custom);
                }
                if (object.body != null)
                    message.body = String(object.body);
                if (object.response_body != null)
                    message.response_body = String(object.response_body);
                if (object.additional_bindings) {
                    if (!Array.isArray(object.additional_bindings))
                        throw TypeError(".google.api.HttpRule.additional_bindings: array expected");
                    message.additional_bindings = [];
                    for (let i = 0; i < object.additional_bindings.length; ++i) {
                        if (typeof object.additional_bindings[i] !== "object")
                            throw TypeError(".google.api.HttpRule.additional_bindings: object expected");
                        message.additional_bindings[i] = $root.google.api.HttpRule.fromObject(object.additional_bindings[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a HttpRule message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.api.HttpRule
             * @static
             * @param {google.api.HttpRule} message HttpRule
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HttpRule.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.arrays || options.defaults)
                    object.additional_bindings = [];
                if (options.defaults) {
                    object.selector = "";
                    object.body = "";
                    object.response_body = "";
                }
                if (message.selector != null && message.hasOwnProperty("selector"))
                    object.selector = message.selector;
                if (message.get != null && message.hasOwnProperty("get")) {
                    object.get = message.get;
                    if (options.oneofs)
                        object.pattern = "get";
                }
                if (message.put != null && message.hasOwnProperty("put")) {
                    object.put = message.put;
                    if (options.oneofs)
                        object.pattern = "put";
                }
                if (message.post != null && message.hasOwnProperty("post")) {
                    object.post = message.post;
                    if (options.oneofs)
                        object.pattern = "post";
                }
                if (message["delete"] != null && message.hasOwnProperty("delete")) {
                    object["delete"] = message["delete"];
                    if (options.oneofs)
                        object.pattern = "delete";
                }
                if (message.patch != null && message.hasOwnProperty("patch")) {
                    object.patch = message.patch;
                    if (options.oneofs)
                        object.pattern = "patch";
                }
                if (message.body != null && message.hasOwnProperty("body"))
                    object.body = message.body;
                if (message.custom != null && message.hasOwnProperty("custom")) {
                    object.custom = $root.google.api.CustomHttpPattern.toObject(message.custom, options);
                    if (options.oneofs)
                        object.pattern = "custom";
                }
                if (message.additional_bindings && message.additional_bindings.length) {
                    object.additional_bindings = [];
                    for (let j = 0; j < message.additional_bindings.length; ++j)
                        object.additional_bindings[j] = $root.google.api.HttpRule.toObject(message.additional_bindings[j], options);
                }
                if (message.response_body != null && message.hasOwnProperty("response_body"))
                    object.response_body = message.response_body;
                return object;
            };

            /**
             * Converts this HttpRule to JSON.
             * @function toJSON
             * @memberof google.api.HttpRule
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HttpRule.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return HttpRule;
        })();

        api.CustomHttpPattern = (function() {

            /**
             * Properties of a CustomHttpPattern.
             * @memberof google.api
             * @interface ICustomHttpPattern
             * @property {string|null} [kind] CustomHttpPattern kind
             * @property {string|null} [path] CustomHttpPattern path
             */

            /**
             * Constructs a new CustomHttpPattern.
             * @memberof google.api
             * @classdesc Represents a CustomHttpPattern.
             * @implements ICustomHttpPattern
             * @constructor
             * @param {google.api.ICustomHttpPattern=} [properties] Properties to set
             */
            function CustomHttpPattern(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CustomHttpPattern kind.
             * @member {string} kind
             * @memberof google.api.CustomHttpPattern
             * @instance
             */
            CustomHttpPattern.prototype.kind = "";

            /**
             * CustomHttpPattern path.
             * @member {string} path
             * @memberof google.api.CustomHttpPattern
             * @instance
             */
            CustomHttpPattern.prototype.path = "";

            /**
             * Encodes the specified CustomHttpPattern message. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @function encode
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {google.api.ICustomHttpPattern} message CustomHttpPattern message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CustomHttpPattern.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.kind != null && Object.hasOwnProperty.call(message, "kind"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.kind);
                if (message.path != null && Object.hasOwnProperty.call(message, "path"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.path);
                return writer;
            };

            /**
             * Encodes the specified CustomHttpPattern message, length delimited. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @function encodeDelimited
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {google.api.ICustomHttpPattern} message CustomHttpPattern message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CustomHttpPattern.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer.
             * @function decode
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {google.api.CustomHttpPattern} CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CustomHttpPattern.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                let end = length === undefined ? reader.len : reader.pos + length, message = new $root.google.api.CustomHttpPattern();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.kind = reader.string();
                        break;
                    case 2:
                        message.path = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {google.api.CustomHttpPattern} CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CustomHttpPattern.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CustomHttpPattern message.
             * @function verify
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CustomHttpPattern.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.kind != null && message.hasOwnProperty("kind"))
                    if (!$util.isString(message.kind))
                        return "kind: string expected";
                if (message.path != null && message.hasOwnProperty("path"))
                    if (!$util.isString(message.path))
                        return "path: string expected";
                return null;
            };

            /**
             * Creates a CustomHttpPattern message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {google.api.CustomHttpPattern} CustomHttpPattern
             */
            CustomHttpPattern.fromObject = function fromObject(object) {
                if (object instanceof $root.google.api.CustomHttpPattern)
                    return object;
                let message = new $root.google.api.CustomHttpPattern();
                if (object.kind != null)
                    message.kind = String(object.kind);
                if (object.path != null)
                    message.path = String(object.path);
                return message;
            };

            /**
             * Creates a plain object from a CustomHttpPattern message. Also converts values to other types if specified.
             * @function toObject
             * @memberof google.api.CustomHttpPattern
             * @static
             * @param {google.api.CustomHttpPattern} message CustomHttpPattern
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CustomHttpPattern.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                let object = {};
                if (options.defaults) {
                    object.kind = "";
                    object.path = "";
                }
                if (message.kind != null && message.hasOwnProperty("kind"))
                    object.kind = message.kind;
                if (message.path != null && message.hasOwnProperty("path"))
                    object.path = message.path;
                return object;
            };

            /**
             * Converts this CustomHttpPattern to JSON.
             * @function toJSON
             * @memberof google.api.CustomHttpPattern
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CustomHttpPattern.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return CustomHttpPattern;
        })();

        return api;
    })();

    return google;
})();

export const cosmos = $root.cosmos = (() => {

    /**
     * Namespace cosmos.
     * @exports cosmos
     * @namespace
     */
    const cosmos = {};

    cosmos.base = (function() {

        /**
         * Namespace base.
         * @memberof cosmos
         * @namespace
         */
        const base = {};

        base.v1beta1 = (function() {

            /**
             * Namespace v1beta1.
             * @memberof cosmos.base
             * @namespace
             */
            const v1beta1 = {};

            v1beta1.Coin = (function() {

                /**
                 * Properties of a Coin.
                 * @memberof cosmos.base.v1beta1
                 * @interface ICoin
                 * @property {string|null} [denom] Coin denom
                 * @property {string|null} [amount] Coin amount
                 */

                /**
                 * Constructs a new Coin.
                 * @memberof cosmos.base.v1beta1
                 * @classdesc Represents a Coin.
                 * @implements ICoin
                 * @constructor
                 * @param {cosmos.base.v1beta1.ICoin=} [properties] Properties to set
                 */
                function Coin(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * Coin denom.
                 * @member {string} denom
                 * @memberof cosmos.base.v1beta1.Coin
                 * @instance
                 */
                Coin.prototype.denom = "";

                /**
                 * Coin amount.
                 * @member {string} amount
                 * @memberof cosmos.base.v1beta1.Coin
                 * @instance
                 */
                Coin.prototype.amount = "";

                /**
                 * Encodes the specified Coin message. Does not implicitly {@link cosmos.base.v1beta1.Coin.verify|verify} messages.
                 * @function encode
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {cosmos.base.v1beta1.ICoin} message Coin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Coin.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.denom != null && Object.hasOwnProperty.call(message, "denom"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.denom);
                    if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.amount);
                    return writer;
                };

                /**
                 * Encodes the specified Coin message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.Coin.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {cosmos.base.v1beta1.ICoin} message Coin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                Coin.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a Coin message from the specified reader or buffer.
                 * @function decode
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {cosmos.base.v1beta1.Coin} Coin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Coin.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos.base.v1beta1.Coin();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.denom = reader.string();
                            break;
                        case 2:
                            message.amount = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a Coin message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {cosmos.base.v1beta1.Coin} Coin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                Coin.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a Coin message.
                 * @function verify
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                Coin.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.denom != null && message.hasOwnProperty("denom"))
                        if (!$util.isString(message.denom))
                            return "denom: string expected";
                    if (message.amount != null && message.hasOwnProperty("amount"))
                        if (!$util.isString(message.amount))
                            return "amount: string expected";
                    return null;
                };

                /**
                 * Creates a Coin message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {cosmos.base.v1beta1.Coin} Coin
                 */
                Coin.fromObject = function fromObject(object) {
                    if (object instanceof $root.cosmos.base.v1beta1.Coin)
                        return object;
                    let message = new $root.cosmos.base.v1beta1.Coin();
                    if (object.denom != null)
                        message.denom = String(object.denom);
                    if (object.amount != null)
                        message.amount = String(object.amount);
                    return message;
                };

                /**
                 * Creates a plain object from a Coin message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof cosmos.base.v1beta1.Coin
                 * @static
                 * @param {cosmos.base.v1beta1.Coin} message Coin
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                Coin.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.denom = "";
                        object.amount = "";
                    }
                    if (message.denom != null && message.hasOwnProperty("denom"))
                        object.denom = message.denom;
                    if (message.amount != null && message.hasOwnProperty("amount"))
                        object.amount = message.amount;
                    return object;
                };

                /**
                 * Converts this Coin to JSON.
                 * @function toJSON
                 * @memberof cosmos.base.v1beta1.Coin
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                Coin.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return Coin;
            })();

            v1beta1.DecCoin = (function() {

                /**
                 * Properties of a DecCoin.
                 * @memberof cosmos.base.v1beta1
                 * @interface IDecCoin
                 * @property {string|null} [denom] DecCoin denom
                 * @property {string|null} [amount] DecCoin amount
                 */

                /**
                 * Constructs a new DecCoin.
                 * @memberof cosmos.base.v1beta1
                 * @classdesc Represents a DecCoin.
                 * @implements IDecCoin
                 * @constructor
                 * @param {cosmos.base.v1beta1.IDecCoin=} [properties] Properties to set
                 */
                function DecCoin(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * DecCoin denom.
                 * @member {string} denom
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @instance
                 */
                DecCoin.prototype.denom = "";

                /**
                 * DecCoin amount.
                 * @member {string} amount
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @instance
                 */
                DecCoin.prototype.amount = "";

                /**
                 * Encodes the specified DecCoin message. Does not implicitly {@link cosmos.base.v1beta1.DecCoin.verify|verify} messages.
                 * @function encode
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {cosmos.base.v1beta1.IDecCoin} message DecCoin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                DecCoin.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.denom != null && Object.hasOwnProperty.call(message, "denom"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.denom);
                    if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                        writer.uint32(/* id 2, wireType 2 =*/18).string(message.amount);
                    return writer;
                };

                /**
                 * Encodes the specified DecCoin message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.DecCoin.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {cosmos.base.v1beta1.IDecCoin} message DecCoin message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                DecCoin.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a DecCoin message from the specified reader or buffer.
                 * @function decode
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {cosmos.base.v1beta1.DecCoin} DecCoin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                DecCoin.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos.base.v1beta1.DecCoin();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.denom = reader.string();
                            break;
                        case 2:
                            message.amount = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a DecCoin message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {cosmos.base.v1beta1.DecCoin} DecCoin
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                DecCoin.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a DecCoin message.
                 * @function verify
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                DecCoin.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.denom != null && message.hasOwnProperty("denom"))
                        if (!$util.isString(message.denom))
                            return "denom: string expected";
                    if (message.amount != null && message.hasOwnProperty("amount"))
                        if (!$util.isString(message.amount))
                            return "amount: string expected";
                    return null;
                };

                /**
                 * Creates a DecCoin message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {cosmos.base.v1beta1.DecCoin} DecCoin
                 */
                DecCoin.fromObject = function fromObject(object) {
                    if (object instanceof $root.cosmos.base.v1beta1.DecCoin)
                        return object;
                    let message = new $root.cosmos.base.v1beta1.DecCoin();
                    if (object.denom != null)
                        message.denom = String(object.denom);
                    if (object.amount != null)
                        message.amount = String(object.amount);
                    return message;
                };

                /**
                 * Creates a plain object from a DecCoin message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @static
                 * @param {cosmos.base.v1beta1.DecCoin} message DecCoin
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DecCoin.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults) {
                        object.denom = "";
                        object.amount = "";
                    }
                    if (message.denom != null && message.hasOwnProperty("denom"))
                        object.denom = message.denom;
                    if (message.amount != null && message.hasOwnProperty("amount"))
                        object.amount = message.amount;
                    return object;
                };

                /**
                 * Converts this DecCoin to JSON.
                 * @function toJSON
                 * @memberof cosmos.base.v1beta1.DecCoin
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DecCoin.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return DecCoin;
            })();

            v1beta1.IntProto = (function() {

                /**
                 * Properties of an IntProto.
                 * @memberof cosmos.base.v1beta1
                 * @interface IIntProto
                 * @property {string|null} [int] IntProto int
                 */

                /**
                 * Constructs a new IntProto.
                 * @memberof cosmos.base.v1beta1
                 * @classdesc Represents an IntProto.
                 * @implements IIntProto
                 * @constructor
                 * @param {cosmos.base.v1beta1.IIntProto=} [properties] Properties to set
                 */
                function IntProto(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * IntProto int.
                 * @member {string} int
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @instance
                 */
                IntProto.prototype.int = "";

                /**
                 * Encodes the specified IntProto message. Does not implicitly {@link cosmos.base.v1beta1.IntProto.verify|verify} messages.
                 * @function encode
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {cosmos.base.v1beta1.IIntProto} message IntProto message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                IntProto.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.int != null && Object.hasOwnProperty.call(message, "int"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.int);
                    return writer;
                };

                /**
                 * Encodes the specified IntProto message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.IntProto.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {cosmos.base.v1beta1.IIntProto} message IntProto message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                IntProto.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes an IntProto message from the specified reader or buffer.
                 * @function decode
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {cosmos.base.v1beta1.IntProto} IntProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                IntProto.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos.base.v1beta1.IntProto();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.int = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes an IntProto message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {cosmos.base.v1beta1.IntProto} IntProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                IntProto.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies an IntProto message.
                 * @function verify
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                IntProto.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.int != null && message.hasOwnProperty("int"))
                        if (!$util.isString(message.int))
                            return "int: string expected";
                    return null;
                };

                /**
                 * Creates an IntProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {cosmos.base.v1beta1.IntProto} IntProto
                 */
                IntProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.cosmos.base.v1beta1.IntProto)
                        return object;
                    let message = new $root.cosmos.base.v1beta1.IntProto();
                    if (object.int != null)
                        message.int = String(object.int);
                    return message;
                };

                /**
                 * Creates a plain object from an IntProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @static
                 * @param {cosmos.base.v1beta1.IntProto} message IntProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                IntProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults)
                        object.int = "";
                    if (message.int != null && message.hasOwnProperty("int"))
                        object.int = message.int;
                    return object;
                };

                /**
                 * Converts this IntProto to JSON.
                 * @function toJSON
                 * @memberof cosmos.base.v1beta1.IntProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                IntProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return IntProto;
            })();

            v1beta1.DecProto = (function() {

                /**
                 * Properties of a DecProto.
                 * @memberof cosmos.base.v1beta1
                 * @interface IDecProto
                 * @property {string|null} [dec] DecProto dec
                 */

                /**
                 * Constructs a new DecProto.
                 * @memberof cosmos.base.v1beta1
                 * @classdesc Represents a DecProto.
                 * @implements IDecProto
                 * @constructor
                 * @param {cosmos.base.v1beta1.IDecProto=} [properties] Properties to set
                 */
                function DecProto(properties) {
                    if (properties)
                        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                            if (properties[keys[i]] != null)
                                this[keys[i]] = properties[keys[i]];
                }

                /**
                 * DecProto dec.
                 * @member {string} dec
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @instance
                 */
                DecProto.prototype.dec = "";

                /**
                 * Encodes the specified DecProto message. Does not implicitly {@link cosmos.base.v1beta1.DecProto.verify|verify} messages.
                 * @function encode
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {cosmos.base.v1beta1.IDecProto} message DecProto message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                DecProto.encode = function encode(message, writer) {
                    if (!writer)
                        writer = $Writer.create();
                    if (message.dec != null && Object.hasOwnProperty.call(message, "dec"))
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.dec);
                    return writer;
                };

                /**
                 * Encodes the specified DecProto message, length delimited. Does not implicitly {@link cosmos.base.v1beta1.DecProto.verify|verify} messages.
                 * @function encodeDelimited
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {cosmos.base.v1beta1.IDecProto} message DecProto message or plain object to encode
                 * @param {$protobuf.Writer} [writer] Writer to encode to
                 * @returns {$protobuf.Writer} Writer
                 */
                DecProto.encodeDelimited = function encodeDelimited(message, writer) {
                    return this.encode(message, writer).ldelim();
                };

                /**
                 * Decodes a DecProto message from the specified reader or buffer.
                 * @function decode
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @param {number} [length] Message length if known beforehand
                 * @returns {cosmos.base.v1beta1.DecProto} DecProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                DecProto.decode = function decode(reader, length) {
                    if (!(reader instanceof $Reader))
                        reader = $Reader.create(reader);
                    let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos.base.v1beta1.DecProto();
                    while (reader.pos < end) {
                        let tag = reader.uint32();
                        switch (tag >>> 3) {
                        case 1:
                            message.dec = reader.string();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                        }
                    }
                    return message;
                };

                /**
                 * Decodes a DecProto message from the specified reader or buffer, length delimited.
                 * @function decodeDelimited
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                 * @returns {cosmos.base.v1beta1.DecProto} DecProto
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                DecProto.decodeDelimited = function decodeDelimited(reader) {
                    if (!(reader instanceof $Reader))
                        reader = new $Reader(reader);
                    return this.decode(reader, reader.uint32());
                };

                /**
                 * Verifies a DecProto message.
                 * @function verify
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {Object.<string,*>} message Plain object to verify
                 * @returns {string|null} `null` if valid, otherwise the reason why it is not
                 */
                DecProto.verify = function verify(message) {
                    if (typeof message !== "object" || message === null)
                        return "object expected";
                    if (message.dec != null && message.hasOwnProperty("dec"))
                        if (!$util.isString(message.dec))
                            return "dec: string expected";
                    return null;
                };

                /**
                 * Creates a DecProto message from a plain object. Also converts values to their respective internal types.
                 * @function fromObject
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {Object.<string,*>} object Plain object
                 * @returns {cosmos.base.v1beta1.DecProto} DecProto
                 */
                DecProto.fromObject = function fromObject(object) {
                    if (object instanceof $root.cosmos.base.v1beta1.DecProto)
                        return object;
                    let message = new $root.cosmos.base.v1beta1.DecProto();
                    if (object.dec != null)
                        message.dec = String(object.dec);
                    return message;
                };

                /**
                 * Creates a plain object from a DecProto message. Also converts values to other types if specified.
                 * @function toObject
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @static
                 * @param {cosmos.base.v1beta1.DecProto} message DecProto
                 * @param {$protobuf.IConversionOptions} [options] Conversion options
                 * @returns {Object.<string,*>} Plain object
                 */
                DecProto.toObject = function toObject(message, options) {
                    if (!options)
                        options = {};
                    let object = {};
                    if (options.defaults)
                        object.dec = "";
                    if (message.dec != null && message.hasOwnProperty("dec"))
                        object.dec = message.dec;
                    return object;
                };

                /**
                 * Converts this DecProto to JSON.
                 * @function toJSON
                 * @memberof cosmos.base.v1beta1.DecProto
                 * @instance
                 * @returns {Object.<string,*>} JSON object
                 */
                DecProto.prototype.toJSON = function toJSON() {
                    return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                };

                return DecProto;
            })();

            return v1beta1;
        })();

        return base;
    })();

    return cosmos;
})();

export const cosmos_proto = $root.cosmos_proto = (() => {

    /**
     * Namespace cosmos_proto.
     * @exports cosmos_proto
     * @namespace
     */
    const cosmos_proto = {};

    cosmos_proto.InterfaceDescriptor = (function() {

        /**
         * Properties of an InterfaceDescriptor.
         * @memberof cosmos_proto
         * @interface IInterfaceDescriptor
         * @property {string|null} [name] InterfaceDescriptor name
         * @property {string|null} [description] InterfaceDescriptor description
         */

        /**
         * Constructs a new InterfaceDescriptor.
         * @memberof cosmos_proto
         * @classdesc Represents an InterfaceDescriptor.
         * @implements IInterfaceDescriptor
         * @constructor
         * @param {cosmos_proto.IInterfaceDescriptor=} [properties] Properties to set
         */
        function InterfaceDescriptor(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * InterfaceDescriptor name.
         * @member {string} name
         * @memberof cosmos_proto.InterfaceDescriptor
         * @instance
         */
        InterfaceDescriptor.prototype.name = "";

        /**
         * InterfaceDescriptor description.
         * @member {string} description
         * @memberof cosmos_proto.InterfaceDescriptor
         * @instance
         */
        InterfaceDescriptor.prototype.description = "";

        /**
         * Encodes the specified InterfaceDescriptor message. Does not implicitly {@link cosmos_proto.InterfaceDescriptor.verify|verify} messages.
         * @function encode
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {cosmos_proto.IInterfaceDescriptor} message InterfaceDescriptor message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        InterfaceDescriptor.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.description != null && Object.hasOwnProperty.call(message, "description"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
            return writer;
        };

        /**
         * Encodes the specified InterfaceDescriptor message, length delimited. Does not implicitly {@link cosmos_proto.InterfaceDescriptor.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {cosmos_proto.IInterfaceDescriptor} message InterfaceDescriptor message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        InterfaceDescriptor.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an InterfaceDescriptor message from the specified reader or buffer.
         * @function decode
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cosmos_proto.InterfaceDescriptor} InterfaceDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        InterfaceDescriptor.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos_proto.InterfaceDescriptor();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.description = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an InterfaceDescriptor message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cosmos_proto.InterfaceDescriptor} InterfaceDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        InterfaceDescriptor.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an InterfaceDescriptor message.
         * @function verify
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        InterfaceDescriptor.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.description != null && message.hasOwnProperty("description"))
                if (!$util.isString(message.description))
                    return "description: string expected";
            return null;
        };

        /**
         * Creates an InterfaceDescriptor message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cosmos_proto.InterfaceDescriptor} InterfaceDescriptor
         */
        InterfaceDescriptor.fromObject = function fromObject(object) {
            if (object instanceof $root.cosmos_proto.InterfaceDescriptor)
                return object;
            let message = new $root.cosmos_proto.InterfaceDescriptor();
            if (object.name != null)
                message.name = String(object.name);
            if (object.description != null)
                message.description = String(object.description);
            return message;
        };

        /**
         * Creates a plain object from an InterfaceDescriptor message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cosmos_proto.InterfaceDescriptor
         * @static
         * @param {cosmos_proto.InterfaceDescriptor} message InterfaceDescriptor
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        InterfaceDescriptor.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.name = "";
                object.description = "";
            }
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.description != null && message.hasOwnProperty("description"))
                object.description = message.description;
            return object;
        };

        /**
         * Converts this InterfaceDescriptor to JSON.
         * @function toJSON
         * @memberof cosmos_proto.InterfaceDescriptor
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        InterfaceDescriptor.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return InterfaceDescriptor;
    })();

    cosmos_proto.ScalarDescriptor = (function() {

        /**
         * Properties of a ScalarDescriptor.
         * @memberof cosmos_proto
         * @interface IScalarDescriptor
         * @property {string|null} [name] ScalarDescriptor name
         * @property {string|null} [description] ScalarDescriptor description
         * @property {Array.<cosmos_proto.ScalarType>|null} [field_type] ScalarDescriptor field_type
         * @property {string|null} [legacy_amino_encoding] ScalarDescriptor legacy_amino_encoding
         */

        /**
         * Constructs a new ScalarDescriptor.
         * @memberof cosmos_proto
         * @classdesc Represents a ScalarDescriptor.
         * @implements IScalarDescriptor
         * @constructor
         * @param {cosmos_proto.IScalarDescriptor=} [properties] Properties to set
         */
        function ScalarDescriptor(properties) {
            this.field_type = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ScalarDescriptor name.
         * @member {string} name
         * @memberof cosmos_proto.ScalarDescriptor
         * @instance
         */
        ScalarDescriptor.prototype.name = "";

        /**
         * ScalarDescriptor description.
         * @member {string} description
         * @memberof cosmos_proto.ScalarDescriptor
         * @instance
         */
        ScalarDescriptor.prototype.description = "";

        /**
         * ScalarDescriptor field_type.
         * @member {Array.<cosmos_proto.ScalarType>} field_type
         * @memberof cosmos_proto.ScalarDescriptor
         * @instance
         */
        ScalarDescriptor.prototype.field_type = $util.emptyArray;

        /**
         * ScalarDescriptor legacy_amino_encoding.
         * @member {string} legacy_amino_encoding
         * @memberof cosmos_proto.ScalarDescriptor
         * @instance
         */
        ScalarDescriptor.prototype.legacy_amino_encoding = "";

        /**
         * Encodes the specified ScalarDescriptor message. Does not implicitly {@link cosmos_proto.ScalarDescriptor.verify|verify} messages.
         * @function encode
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {cosmos_proto.IScalarDescriptor} message ScalarDescriptor message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScalarDescriptor.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.description != null && Object.hasOwnProperty.call(message, "description"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
            if (message.field_type != null && message.field_type.length) {
                writer.uint32(/* id 3, wireType 2 =*/26).fork();
                for (let i = 0; i < message.field_type.length; ++i)
                    writer.int32(message.field_type[i]);
                writer.ldelim();
            }
            if (message.legacy_amino_encoding != null && Object.hasOwnProperty.call(message, "legacy_amino_encoding"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.legacy_amino_encoding);
            return writer;
        };

        /**
         * Encodes the specified ScalarDescriptor message, length delimited. Does not implicitly {@link cosmos_proto.ScalarDescriptor.verify|verify} messages.
         * @function encodeDelimited
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {cosmos_proto.IScalarDescriptor} message ScalarDescriptor message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ScalarDescriptor.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ScalarDescriptor message from the specified reader or buffer.
         * @function decode
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {cosmos_proto.ScalarDescriptor} ScalarDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScalarDescriptor.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.cosmos_proto.ScalarDescriptor();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.description = reader.string();
                    break;
                case 3:
                    if (!(message.field_type && message.field_type.length))
                        message.field_type = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.field_type.push(reader.int32());
                    } else
                        message.field_type.push(reader.int32());
                    break;
                case 4:
                    message.legacy_amino_encoding = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ScalarDescriptor message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {cosmos_proto.ScalarDescriptor} ScalarDescriptor
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ScalarDescriptor.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ScalarDescriptor message.
         * @function verify
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ScalarDescriptor.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.description != null && message.hasOwnProperty("description"))
                if (!$util.isString(message.description))
                    return "description: string expected";
            if (message.field_type != null && message.hasOwnProperty("field_type")) {
                if (!Array.isArray(message.field_type))
                    return "field_type: array expected";
                for (let i = 0; i < message.field_type.length; ++i)
                    switch (message.field_type[i]) {
                    default:
                        return "field_type: enum value[] expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
            }
            if (message.legacy_amino_encoding != null && message.hasOwnProperty("legacy_amino_encoding"))
                if (!$util.isString(message.legacy_amino_encoding))
                    return "legacy_amino_encoding: string expected";
            return null;
        };

        /**
         * Creates a ScalarDescriptor message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {cosmos_proto.ScalarDescriptor} ScalarDescriptor
         */
        ScalarDescriptor.fromObject = function fromObject(object) {
            if (object instanceof $root.cosmos_proto.ScalarDescriptor)
                return object;
            let message = new $root.cosmos_proto.ScalarDescriptor();
            if (object.name != null)
                message.name = String(object.name);
            if (object.description != null)
                message.description = String(object.description);
            if (object.field_type) {
                if (!Array.isArray(object.field_type))
                    throw TypeError(".cosmos_proto.ScalarDescriptor.field_type: array expected");
                message.field_type = [];
                for (let i = 0; i < object.field_type.length; ++i)
                    switch (object.field_type[i]) {
                    default:
                    case "SCALAR_TYPE_UNSPECIFIED":
                    case 0:
                        message.field_type[i] = 0;
                        break;
                    case "SCALAR_TYPE_STRING":
                    case 1:
                        message.field_type[i] = 1;
                        break;
                    case "SCALAR_TYPE_BYTES":
                    case 2:
                        message.field_type[i] = 2;
                        break;
                    }
            }
            if (object.legacy_amino_encoding != null)
                message.legacy_amino_encoding = String(object.legacy_amino_encoding);
            return message;
        };

        /**
         * Creates a plain object from a ScalarDescriptor message. Also converts values to other types if specified.
         * @function toObject
         * @memberof cosmos_proto.ScalarDescriptor
         * @static
         * @param {cosmos_proto.ScalarDescriptor} message ScalarDescriptor
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ScalarDescriptor.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.field_type = [];
            if (options.defaults) {
                object.name = "";
                object.description = "";
                object.legacy_amino_encoding = "";
            }
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.description != null && message.hasOwnProperty("description"))
                object.description = message.description;
            if (message.field_type && message.field_type.length) {
                object.field_type = [];
                for (let j = 0; j < message.field_type.length; ++j)
                    object.field_type[j] = options.enums === String ? $root.cosmos_proto.ScalarType[message.field_type[j]] : message.field_type[j];
            }
            if (message.legacy_amino_encoding != null && message.hasOwnProperty("legacy_amino_encoding"))
                object.legacy_amino_encoding = message.legacy_amino_encoding;
            return object;
        };

        /**
         * Converts this ScalarDescriptor to JSON.
         * @function toJSON
         * @memberof cosmos_proto.ScalarDescriptor
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ScalarDescriptor.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ScalarDescriptor;
    })();

    /**
     * ScalarType enum.
     * @name cosmos_proto.ScalarType
     * @enum {number}
     * @property {number} SCALAR_TYPE_UNSPECIFIED=0 SCALAR_TYPE_UNSPECIFIED value
     * @property {number} SCALAR_TYPE_STRING=1 SCALAR_TYPE_STRING value
     * @property {number} SCALAR_TYPE_BYTES=2 SCALAR_TYPE_BYTES value
     */
    cosmos_proto.ScalarType = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "SCALAR_TYPE_UNSPECIFIED"] = 0;
        values[valuesById[1] = "SCALAR_TYPE_STRING"] = 1;
        values[valuesById[2] = "SCALAR_TYPE_BYTES"] = 2;
        return values;
    })();

    return cosmos_proto;
})();

export { $root as default };
