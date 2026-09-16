/** @type {MarkdownTableBuilderContructor} */
var MarkdownTableBuilder = (function() {
    /**
     * @param {string} value 
     * @param {MarkdownTableCellEscapeOption} escapeOption 
     */
    function convertToMdEscaped(value, escapeOption) {
        switch (escapeOption) {
            case "minimal":
                return MarkdownGenerationContext.minimalEscapeForTableCellMarkdown(MarkdownGenerationContext.normalizeWhiteSpace(value));
            case "normal":
                return MarkdownGenerationContext.escapeForMarkdown(MarkdownGenerationContext.normalizeWhiteSpace(value));
            default:
                return value;
        }
    }

    /**
     * @param {any} value 
     * @param {any} defaultValue 
     */
    function coerceToString(value, defaultValue) {
        switch(typeof value) {
            case "string":
                return value;
            // case "symbol":
            case "function":
            case "undefined":
                switch (typeof defaultValue) {
                    case 'string':
                        return defaultValue;
                    case 'undefined':
                    case 'symbol':
                        return '';
                    default:
                        return JSON.stringify(defaultValue);
                }
            default:
                return JSON.stringify(value);
        }
    }

    /**
     * @param {any} value 
     * @returns {(string | symbol)}
     */
    function coerceToKey(value) {
        switch (typeof value) {
            case 'string':
            case 'symbol':
                return value;
            case 'undefined':
                return '';
            default:
                return '' + value;
        }
    }

    function getPadChars(value, length) {
        if (length < 0)
            return '';
        var result = value;
        for (i = 1; i < length; i++)
            result += value;
        return result;
    }

    var S_widestCell = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {MarkdownTableCellAccessor}
     */
    function _getWidestCell(columnHeading) {
        return columnHeading[S_widestCell];
    }

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @param {MarkdownTableCellAccessor} value
     */
    function _setWidestCell(columnHeading, value) {
        columnHeading[S_widestCell] = value;
    }

    var S_builder = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableRowAccessor)} obj
     * @returns {MarkdownTableBuilder}
     */
    function _getBuilder(obj) {
        return obj[S_builder];
    }

    var S_key = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {(string | symbol)}
     */
    function _getKey(columnHeading) {
        return columnHeading[S_key];
    }

    var S_escapedHeading = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {string}
     */
    function _getEscapedHeading(columnHeading) {
        return columnHeading[S_escapedHeading];
    }

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @param {string} value
     */
    function _setEscapedHeading(columnHeading, value) {
        columnHeading[S_escapedHeading] = value;
    }

    var S_rawHeading = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {string}
     */
    function _getRawHeading(columnHeading) {
        return columnHeading[S_rawHeading];
    }

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @param {string} value
     */
    function _setRawHeading(columnHeading, value) {
        columnHeading[S_rawHeading] = value;
    }

    var S_align = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {MarkdownTableColumnAlignment}
     */
    function _getAlign(columnHeading) {
        return columnHeading[S_align];
    }

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @param {MarkdownTableColumnAlignment} value
     * @param {boolean} [onlyIfNotNil]
     */
    function _setAlign(columnHeading, value, onlyIfNotNil) {
        if (typeof value === 'undefined' || value === null) {
            if (onlyIfNotNil)
                columnHeading[S_align] = "default";
        } else {
            if (typeof value !== 'string')
                value = '' + value;
            switch (value) {
                case "center":
                case "left":
                case "right":
                case "default":
                    columnHeading[S_align] = value;
                    break;
                case "":
                    if (onlyIfNotNil)
                        columnHeading[S_align] = "default";
                    break;
                default:
                    value = value.tolower().trim();
                    switch (value) {
                        case "center":
                        case "left":
                        case "right":
                        case "default":
                            columnHeading[S_align] = value;
                            break;
                        case "":
                            if (onlyIfNotNil)
                                columnHeading[S_align] = "default";
                            break;
                        default:
                            columnHeading[S_align] = "default";
                            break;
                    }
                    break;
            }
        }
    }

    var S_escapingOption = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor)} obj
     * @returns {MarkdownTableCellEscapeOption}
     */
    function _getEscapingOption(obj) {
        return obj[S_escapingOption];
    }

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableRowAccessor)} obj
     * @param {MarkdownTableCellEscapeOption} value
     * @param {boolean} [onlyIfNotNil]
     */
    function _setEscapingOption(obj, value, onlyIfNotNil) {
        if (typeof value === 'undefined' || value === null) {
            if (onlyIfNotNil)
                obj[S_escapingOption] = "normal";
        } else {
            if (typeof value !== 'string') 
                value = '' + value;
            switch (value) {
                case "none":
                case "minimal":
                case "normal":
                    obj[S_escapingOption] = value;
                    break;
                case "":
                    if (onlyIfNotNil)
                        obj[S_escapingOption] = "normal";
                    break;
                default:
                    value = value.tolower().trim();
                    switch (value) {
                        case "none":
                        case "minimal":
                        case "default":
                            obj[S_escapingOption] = value;
                            break;
                        case "":
                            if (onlyIfNotNil)
                                obj[S_escapingOption] = "normal";
                            break;
                        default:
                            obj[S_escapingOption] = "normal";
                            break;
                    }
                    break;
            }
        }
    }

    var S_index = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableRowAccessor)} obj
     * @returns {number}
     */
    function _getIndex(obj) {
        return obj[S_index];
    }

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableRowAccessor)} obj
     * @param {number} value
     */
    function _setIndex(obj, value) {
        obj[S_index] = value;
    }

    var S_defaultValue = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {string}
     */
    function _getDefaultValue(columnHeading) {
        return columnHeading[S_defaultValue];
    }

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @param {string} value
     */
    function _setDefaultValue(columnHeading, value) {
        columnHeading[S_defaultValue] = value;
    }

    var S_bold = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor)} obj
     * @returns {boolean}
     */
    function _getBold(obj) {
        return obj[S_bold];
    }

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor} obj
     * @param {boolean} value
     * @param {boolean} [onlyIfNotNil]
     */
    function _setBold(obj, value, onlyIfNotNil) {
        if (onlyIfNotNil && typeof value === 'undefined' || value === null)
            return;
        obj[S_bold] = value == true;
    }

    var S_italic = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor} obj
     * @returns {boolean}
     */
    function _getItalic(obj) {
        return obj[S_italic];
    }

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor} obj
     * @param {boolean} value
     * @param {boolean} [onlyIfNotNil]
     */
    function _setItalic(obj, value, onlyIfNotNil) {
        if (onlyIfNotNil && typeof value === 'undefined' || value === null)
            return;
        obj[S_italic] = value == true;
    }

    var S_code = Symbol();

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor} obj
     * @returns {boolean}
     */
    function _getCode(obj) {
        return obj[S_code];
    }

    /**
     * @param {(MarkdownTableColumHeadingAccessor | MarkdownTableCellAccessor} obj
     * @param {boolean} value
     * @param {boolean} [onlyIfNotNil]
     */
    function _setCode(obj, value, onlyIfNotNil) {
        if (onlyIfNotNil && typeof value === 'undefined' || value === null)
            return;
        obj[S_code] = value == true;
    }

    var S_resetWidestCell = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     */
    function _resetWidestCell(columnHeading) {
        return columnHeading[S_resetWidestCell]();
    }

    var S_calculateMinWidth = Symbol();

    /**
     * @param {MarkdownTableColumHeadingAccessor} columnHeading
     * @returns {number}
     */
    function _calculateMinWidth(columnHeading) {
        return columnHeading[S_calculateMinWidth]();
    }

    var S_row = Symbol();

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @returns {MarkdownTableRowAccessor}
     */
    function _getRow(tableCell) {
        return tableCell[S_row];
    }

    var S_heading = Symbol();

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @returns {MarkdownTableColumHeadingAccessor}
     */
    function _getHeading(tableCell) {
        return tableCell[S_heading];
    }

    var S_escapedValue = Symbol();

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @returns {string}
     */
    function _getEscapedValue(tableCell) {
        return tableCell[S_escapedValue];
    }

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @param {string} value
     */
    function _setEscapedValue(tableCell, value) {
        tableCell[S_escapedValue] = value;
    }

    var S_rawValue = Symbol();

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @returns {string}
     */
    function _getRawValue(tableCell) {
        return tableCell[S_rawValue];
    }

    /**
     * @param {MarkdownTableCellAccessor} tableCell
     * @param {string} value
     */
    function _setRawValue(tableCell, value) {
        tableCell[S_rawValue] = value;
    }

    var S_valueMap = Symbol();

    /**
     * @param {MarkdownTableRowAccessor} tableRow
     * @returns {{ [key: string | symbol]: MarkdownTableCellAccessor; }}
     */
    function _getValueMap(tableRow) {
        return tableRow[S_valueMap];
    }

    var S_valueArray = Symbol();

    /**
     * @param {MarkdownTableRowAccessor} tableRow
     * @returns {MarkdownTableCellAccessor[]}
     */
    function _getValueArray(tableRow) {
        return tableRow[S_valueArray];
    }

    var S_autoAddColumnsOnNewRow = Symbol();

    var S_headingArray = Symbol();

    /**
     * @param {MarkdownTableBuilder} builder
    * @returns {MarkdownTableColumHeadingAccessor[]}
     */
    function _getHeadingArray(builder) {
        return builder[S_headingArray];
    }

    var S_headingMap = Symbol();

    /**
     * @param {MarkdownTableBuilder} builder
     * @returns {{ [key: string]: MarkdownTableColumHeadingAccessor; }}
     */
    function _getHeadingMap(builder) {
        return builder[S_headingMap];
    }

    var S_rows = Symbol();

    /**
     * @param {MarkdownTableBuilder} builder
     * @returns {MarkdownTableRowAccessor[]}
     */
    function _getRows(builder) {
        return builder[S_rows];
    }

    var S_createColumn = Symbol();

    /**
     * 
     * @param {MarkdownTableBuilder} builder
     * @param {number} index 
     * @param {(string | symbol)} key 
     * @param {string} headingText 
     * @param {MarkdownTableCellEscapeOption} escapingOption 
     * @returns {MarkdownTableColumHeadingAccessor}
     */
    function _createColumn(builder, index, key, headingText, escapingOption) {
        return builder[S_createColumn](index, key, headingText, escapingOption);
    }

    /**
     * @type {({ new(key: string | symbol, index: number, heading: string, defaultValue: string, escapeOption: MarkdownTableCellEscapeOption, alignment: MarkdownTableColumnAlignment, builder: MarkdownTableBuilder): MarkdownTableColumHeadingAccessor; })}
     */
    var MarkdownTableColumHeadingAccessor = Class.create();
    MarkdownTableColumHeadingAccessor.prototype = {
        /**
         * @param {(string | symbol)} key 
         * @param {number} index 
         * @param {string} heading 
         * @param {string} defaultValue 
         * @param {MarkdownTableCellEscapeOption} escapeOption 
         * @param {MarkdownTableColumnAlignment} alignment 
         * @param {MarkdownTableBuilder} builder 
         * @this {MarkdownTableColumHeadingAccessor}
         */
        initialize: function(key, index, heading, defaultValue, escapeOption, alignment, builder) {
            _setBold(this, false);
            _setItalic(this, false);
            _setCode(this, false);
            this[S_key] = coerceToKey(key);
            _setIndex(this, index);
            _setEscapingOption(this, escapeOption);
            _setRawHeading(this, heading);
            _setEscapedHeading(this, convertToMdEscaped(heading, _getEscapingOption(this)));
            _setDefaultValue(this, coerceToString(defaultValue));
            _setAlign(this, alignment);
            this[S_builder] = builder;
        },
        /**
         * @returns {MarkdownTableBuilder}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getBuilder: function() {
            return _getBuilder(this);
        },
        /**
         * @returns {(string | symbol)}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getKey: function() {
            return _getKey(this);
        },
        /**
         * @returns {number}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getColumnIndex: function() {
            return _getIndex(this);
        },
        /**
         * @param {boolean} [rawValue] 
         * @returns {getHeading}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getHeading: function(rawValue) {
            return rawValue ? _getRawHeading(this) : getEscapedHeading(this);
        },
        /**
         * @returns {number}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        calculateWidth: function() {
            /** @type {(MarkdownTableCellAccessor | undefined)} */
            var cell = _getWidestCell(this);
            return (typeof cell == 'undefined') ? _calculateMinWidth(this) : cell.calculateMinWidth();
        },
        /**
         * @returns {string}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getDefaultValue: function() {
            return _getDefaultValue(this);
        },
        /**
         * @returns {MarkdownTableCellEscapeOption}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        getEscapingOption: function() {
            return _getEscapingOption(this);
        },
        /**
         * @param {(string | MarkdownTableHeadingSpec)} heading
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @this {MarkdownTableColumHeadingAccessor}
         */
        setHeading: function(heading, escapingOption) {
            var previousLength = _calculateMinWidth(this);
            if (typeof heading === 'object' && heading !== null) {
                _setAlign(this, heading.align, true);
                _setBold(this, heading.bold == true, true);
                _setItalic(this, heading.italic == true, true);
                _setCode(this, heading.code == true, true);
                if (typeof heading.defaultValue !== 'undefined' && heading.defaultValue !== null)
                    _setDefaultValue(this, coerceToString(heading.defaultValue));
                _setEscapingOption(this, heading.escapingOption, true);
                _setRawHeading(this, coerceToString(heading.heading));
            } else {
                if (arguments.length > 1)
                    _setEscapingOption(this, escapingOption);
                _setRawHeading(this, coerceToString(heading));
            }
            _setEscapedHeading(this, convertToMdEscaped(_getRawHeading(this)));
            var newLength = _calculateMinWidth(this);
            /** @type {(MarkdownTableCellAccessor | undefined)} */
            var widestCell = _getWidestCell(this);
            if (newLength < previousLength) {
                if (typeof widestCell == 'undefined')
                    _resetWidestCell(this);
            } else if (typeof widestCell != 'undefined' && newLength > widestCell.calculateMinWidth())
                _setWidestCell(this, undefined);
        },
        /**
         * @param {MarkdownTableColumnAlignment} align
         * @this {MarkdownTableColumHeadingAccessor}
         */
        setAlignment: function(align) {
            _setAlign(this, align);
        },

        /**
         * @returns {boolean}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        isBold: function() {
            return _getBold(this);
        },

        /**
         * @param {boolean} enabled
         * @this {MarkdownTableColumHeadingAccessor}
         */
        setBold: function(enabled) {
            _setBold(this, enabled == true);
        },

        /**
         * @returns {boolean}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        isItalic: function() {
            return _getItalic(this);
        },

        /**
         * @param {boolean} enabled
         * @this {MarkdownTableColumHeadingAccessor}
         */
        setItalic: function(enabled) {
            _setItalic(this, enabled == true);
        },

        /**
         * @returns {boolean}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        isCode: function() {
            return _getCode(this)   ;
        },

        /**
         * @param {boolean} enabled
         * @this {MarkdownTableColumHeadingAccessor}
         */
        setCode: function(enabled) {
            _setCode(this, enabled == true);
        },

        /**
         * @returns {string}
         * @this {MarkdownTableColumHeadingAccessor}
         */
        toString: function() {
            var result = _getEscapedHeading(this);
            if (_getCode(this))
                result = '`' + result + '`';
            if (_getItalic(this))
                result = '*' + result + '*';
            return _getBold(this) ? '**' + result + '**' : result;
        },

        type: "MarkdownTableBuilder.MarkdownTableColumHeading"
    };

    /**
     * @this {MarkdownTableColumHeadingAccessor}
     */
    MarkdownTableColumHeadingAccessor.prototype[S_resetWidestCell] = function() {
        /** @type {MarkdownTableCellAccessor} */
        var widestCell;
        var bldr = _getBuilder(this);
        var len = _calculateMinWidth(this);
        var rows = _getRows(bldr);
        for (var i = 0; i < rows.length; i++) {
            /** @type {(MarkdownTableCellAccessor | undefined)} */
            var item = _getValueArray(rows[i])[_getIndex(this)];
            var n = item.calculateMinWidth();
            if (n > len) {
                widestCell = item;
                len = n;
            }
        }
        _setWidestCell(this, widestCell);
    };

    /**
     * @returns {number}
     * @this {MarkdownTableColumHeadingAccessor}
     */
    MarkdownTableColumHeadingAccessor.prototype[S_calculateMinWidth] = function() {
        return _getBold(this) ? (_getCode(this) ? 8 : 6) + _getEscapedHeading(this).length :
            _getItalic(this) ? (_getCode(this) ? 4 : 2) + _getEscapedHeading(this).length : _getCode(this) ? 2 + _getEscapedHeading(this).length : _getEscapedHeading(this).length;
    };

    /** @type { new(heading: MarkdownTableColumHeadingAccessor, row: MarkdownTableRowAccessor, value: string, escapingOption: MarkdownTableCellEscapeOption): MarkdownTableCellAccessor } */
    var MarkdownTableCellAccessor = Class.create();
    MarkdownTableCellAccessor.prototype = {
        /**
         * @param {MarkdownTableColumHeadingAccessor} heading 
         * @param {MarkdownTableRowAccessor} row 
         * @param {string} value 
         * @param {MarkdownTableCellEscapeOption} escapeOption 
         * @this {MarkdownTableCellAccessor}
         */
        initialize: function(heading, row, value, escapeOption) {
            _setBold(this, false);
            _setItalic(this, false);
            _setCode(this, false);
            this[S_heading] = heading;
            this[S_row] = row;
            _setRawValue(this, value);
            _setEscapingOption(this, escapeOption);
            _setEscapedValue(this, convertToMdEscaped(value, _getEscapingOption(this)));
        },
        /**
         * @returns {MarkdownTableColumHeadingAccessor}
         * @this {MarkdownTableCellAccessor}
         */
        getHeading: function() {
            return _getHeading(this);
        },
        /**
         * @returns {MarkdownTableRowAccessor}
         * @this {MarkdownTableCellAccessor}
         */
        getRow: function() {
            return _getRow(this);
        },
        /**
         * @param {boolean} [rawValue] 
         * @returns {string}
         * @this {MarkdownTableCellAccessor}
         */
        getValue: function(rawValue) {
            return rawValue ? _getRawValue(this) : _getEscapedValue(this);
        },
        /**
         * @returns {MarkdownTableCellEscapeOption}
         * @this {MarkdownTableCellAccessor}
         */
        getEscapingOption: function() {
            return _getEscapingOption(this);
        },
        /**
         * @param {(string | MarkdownTableCellSpec)} value 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @this {MarkdownTableCellAccessor}
         */
        setValue: function(value, escapingOption) {
            var previousLength = this.calculateMinWidth();
            if (typeof value === 'object' && value !== null) {
                _setBold(this, value.bold == true, true);
                _setCode(this, value.code == true, true);
                _setItalic(this, value.italic == true, true);
                _setEscapingOption(this, value.escapingOption, true);
                _setRawValue(this, coerceToString(value.value));
            } else {
                _setRawValue(this, coerceToString(value));
                if (arguments.length > 1)
                    _setEscapingOption(this, escapingOption);
            }
            _setEscapedValue(this, convertToMdEscaped(_getRawValue(this), _getEscapingOption(this)));
            var newLength = this.calculateMinWidth();
            var h = _getHeading(this);
            /** @type {(MarkdownTableCellAccessor | undefined)} */
            if (typeof _getWidestCell(h) === 'undefined') {
                if (newLength > previousLength)
                    _setWidestCell(h, this);
            } else if (_getIndex(_getHeading(widest)) == _getIndex(h)) {
                if (newLength < previousLength)
                    _resetWidestCell(h);
            } else {
                if (newLength > widest.calculateMinWidth())
                    _setWidestCell(h, this);
            }
        },

        /**
         * @returns {string}
         * @this {MarkdownTableCellAccessor}
         */
        toString: function() {
            var result = _getEscapedValue(this);
            if (_getCode(this))
                result = '`' + result + '`';
            if (_getItalic(this))
                result = '*' + result + '*';
            return _getBold(this) ? '**' + result + '**' : result;
        },

        /**
         * @returns {number}
         * @this {MarkdownTableCellAccessor}
         */
        calculateMinWidth: function() {
            return _getBold(this) ? (_getCode(this) ? 8 : 6) + _getEscapedValue(this).length :
                _getItalic(this) ? (_getCode(this) ? 4 : 2) + _getEscapedValue(this).length : _getCode(this) ? 2 + _getEscapedValue(this).length : _getEscapedValue(this).length;
        },

        type: "MarkdownTableBuilder.MarkdownTableCellAccessor"
    };

    /**
     * @type {({ new(builder: MarkdownTableBuilder, index: nuumber): MarkdownTableRowAccessor; })}
     */
    var MarkdownTableRowAccessor = Class.create();
    MarkdownTableRowAccessor.prototype = {
        /**
         * @param {MarkdownTableBuilder} builder 
         * @param {number} index 
         * @this {MarkdownTableRowAccessor}
         */
        initialize: function(builder, index) {
            this[S_valueArray] = [];
            this[S_valueMap] = [];
            this[S_builder] = builder;
            _setIndex(this, index);
        },
        /**
         * @returns {MarkdownTableBuilder}
         * @this {MarkdownTableRowAccessor}
         */
        getBuilder: function() {
            return _getBuilder(this);
        },
        /**
         * @returns {number}
         * @this {MarkdownTableRowAccessor}
         */
        getRowIndex: function() {
            return _getIndex(this);
        },
        /**
         * @returns {Iterator<MarkdownTableCellAccessor>}
         * @this {MarkdownTableRowAccessor}
         */
        getCells: function() {
            return _getValueArray(this)[Symbol.iterator]();
        },
        /**
         * @param {(string | symbol)} key
         * @returns {(MarkdownTableCellAccessor | undefined)}
         * @this {MarkdownTableRowAccessor}
         */
        getCell: function(key) {
            return _getValueMap(this)[key];
        },
        /**
         * @param {number} index
         * @returns {(MarkdownTableCellAccessor | undefined)}
         * @this {MarkdownTableRowAccessor}
         */
        getCellAt: function(index) {
            return _getValueArray(this)[index];
        },
        /**
         * @param {(string | symbol)} key
         * @param {boolean} [rawValue]
         * @returns {(string | undefined)}
         * @this {MarkdownTableRowAccessor}
         */
        getCellValue: function(key, rawValue) {
            var cell = _getValueMap(this)[key];
            if (typeof cell !== 'undefined')
                return cell.getValue(rawValue);
        },
        /**
         * @param {number} index
         * @param {boolean} [rawValue]
         * @returns {(string | undefined)}
         * @this {MarkdownTableRowAccessor}
         */
        getCellValueAt: function(index, rawValue) {
            var cell = _getValueArray(this)[index];
            if (typeof cell !== 'undefined')
                return cell.getValue(rawValue);
        },
        /**
         * @param {(string | symbol)} key
         * @param {(string | MarkdownTableCellSpec)} value
         * @param {MarkdownTableCellEscapeOption} [escapingOption]
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableRowAccessor}
         */
        setCellValue: function(key, value, escapingOption) {
            var cell = _getValueMap(this)[key];
            if (typeof cell === 'undefined')
                throw new Error("Key not found.");
            cell.setValue(value, escapingOption);
            return cell;
        },
        /**
         * @param {number} index
         * @param {(string | MarkdownTableCellSpec)} value
         * @param {MarkdownTableCellEscapeOption} [escapingOption]
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableRowAccessor}
         */
        setCellValueAt: function(index, value, escapingOption) {
            var cell = _getValueArray(this)[index];
            if (typeof cell === 'undefined')
                throw new Error("Index out of range.");
            cell.setValue(value, escapingOption);
            return cell;
        },

        type: "MarkdownTableBuilder.MarkdownTableRowAccessor"
    };

    /** @type {MarkdownTableBuilderContructor} */
    var MarkdownTableBuilderContructor = Class.create();

    MarkdownTableBuilderContructor.prototype = {
        initialize: function() {
            this[S_autoAddColumnsOnNewRow] = false;
            this[S_headingArray] = {};
            this[S_headingMap] = [];
            this[S_rows] = [];
        },
        /**
         * @returns {number}
         * @this {MarkdownTableBuilder}
         */
        getColumnCount: function() {
            return _getHeadingArray(this).length;
        },
        /**
         * @param {(string | symbol)} key 
         * @returns {number}
         * @this {MarkdownTableBuilder}
         */
        indexOf: function(key) {
            var heading = _getHeadingMap(this)[key];
            return (typeof heading === 'undefined') ? -1 : _getIndex(heading);
        },
        /**
         * @returns {Iterator<MarkdownTableColumHeadingAccessor>}
         * @this {MarkdownTableBuilder}
         */
        getHeadings: function() {
            return _getHeadingArray(this)[Symbol.iterator]();
        },
        /**
         * @param {(string | symbol)} key 
         * @returns {(MarkdownTableColumHeadingAccessor | undefined)}
         * @this {MarkdownTableBuilder}
         */
        getHeading: function(key) {
            return _getHeadingMap(this)[key];
        },
        /**
         * @param {number} index 
         * @returns {(MarkdownTableColumHeadingAccessor | undefined)}
         * @this {MarkdownTableBuilder}
         */
        getHeadingAt: function(index) {
            return _getHeadingArray(this)[index];
        },
        /**
         * @param {(string | symbol | AnyMarkdownTableColumnHeadingSpec)} key 
         * @param {(string | MarkdownTableCellEscapeOption)} [headingText] 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableColumHeadingAccessor}
         * @this {MarkdownTableBuilder}
         */
        addColumn: function(key, headingText, escapingOption) {
            var ha = _getHeadingArray(this);
            var column = _createColumn(this, ha.length, key, headingText, escapingOption);
            ha.push(column);
            /** @type {MarkdownTableRowAccessor} */
            var row;
            /** @type {(MarkdownTableCellAccessor | undefined)} */
            var cell;
            var rowArr = _getRows(this);
            for (var i = 0; i < rowArr.length; i++) {
                row = rowArr[i];
                cell = new MarkdownTableCellAccessor(column, row, _getDefaultValue(column), "normal");
                _getValueArray(row).push(cell);
                _getValueMap(row)[k] = cell;
            }
            row = rowArr[0];
            /** @type {MarkdownTableCellAccessor[]} */
            var cellArr = _getValueArray(rowArr);
            cell = cellArr[_getIndex(column)];
            if (_calculateMinWidth(column) < cell.calculateMinWidth())
                _setWidestCell(column, cell);
            return column;
        },
        /**
         * @param {number} index 
         * @param {(string | symbol | AnyMarkdownTableColumnHeadingSpec)} key 
         * @param {(string | MarkdownTableCellEscapeOption)} [headingText] 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableColumHeadingAccessor}
         * @this {MarkdownTableBuilder}
         */
        insertColumn: function(index, key, headingText, escapingOption) {
            if (isNaN(index) || index < 0)
                throw new Error("Index out of range");
            var column, i, row, cell;
            var hArr = _getHeadingArray(this);
            var e = hArr.length;
            var rows = _getRows(this);
            if (index >= e) {
                column = _createColumn(this, e, key, headingText, escapingOption);
                hArr.push(column);
                
                for (i = 0; i < rows.length; i++) {
                    row = rows[i];
                    cell = new MarkdownTableCellAccessor(column, row, _getDefaultValue(column), "normal");
                    _getValueArray(row).push(cell);
                    _getValueMap(row)[k] = cell;
                }
            } else {
                column = _createColumn(this, index, key, headingText, escapingOption);
                if (index == 0)
                    hArr.unshift(column);
                else
                    hArr.splice(index, 0, column);
                for (i = index + 1; i <= e; i++)
                    _setIndex(hArr[i], i);
                for (i = 0; i < rows.length; i++) {
                    cell = new MarkdownTableCellAccessor(column, row, _getDefaultValue(column), "normal");
                    row = rows[i];
                    _getValueArray(row).splice(index, 0, cell);
                    _getValueMap(row)[k] = cell;
                }
            }
            cell = _getValueArray(rows[0])[index];
            if (_calculateMinWidth(column) < cell.calculateMinWidth())
                _setWidestCell(column, cell);
            return column;
        },
        /**
         * @param {(string | symbol)} key 
         * @param {string} headingText 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableColumHeadingAccessor}
         * @this {MarkdownTableBuilder}
         */
        setHeading: function(key, headingText, escapingOption) {
            var column = _getHeadingMap(this)[key];
            if (typeof column == "undefined")
                throw new Error("Key not found");
            column.setHeading(headingText, escapingOption);
            return column;
        },
        /**
         * @param {number} index 
         * @param {string} headingText 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableColumHeadingAccessor}
         * @this {MarkdownTableBuilder}
         */
        setHeadingAt: function(index, headingText, escapingOption) {
            var column = _getHeadingArray(this)[index];
            if (typeof column === "undefined")
                throw new Error("Index out of range");
            column.setHeading(headingText, escapingOption);
            return column;
        },
        /**
         * @param {(string | symbol)} key 
         * @returns {boolean}
         * @this {MarkdownTableBuilder}
         */
        removeColumn: function(key) {
            var column = _getHeadingMap(this)[key];
            if (typeof column == "undefined")
                return false;
            var i, row;
            var rowArr = _getRows(this);
            var hArr = _getHeadingArray(this);
            if (_getIndex(column) == 0) {
                hArr.shift();
                for (i = 0; i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = 0; i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).shift();
                    _getValueMap(row)[key] = undefined;
                }
            } else if (_getIndex(column) < hArr.length) {
                hArr.splice(_getIndex(column), 1);
                for (i = _getIndex(column); i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = _getIndex(column); i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).splice(_getIndex(column), 1);
                    _getValueMap(row)[key] = undefined;
                }
            } else {
                hArr.pop();
                for (i = 0; i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = 0; i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).pop();
                    _getValueMap(row)[key] = undefined;
                }
            }
            for (i = 0; i < hArr.length; i++) {
                var h = hArr[i];
                var wc = _getWidestCell(h);
                if (typeof wc !== 'undefined' && _getKey(_getHeading(wc)) == key)
                    _resetWidestCell(h);
            }
            return true;
        },
        /**
         * @param {number} index 
         * @returns {(string | symbol | undefined)}
         * @this {MarkdownTableBuilder}
         */
        removeColumnAt: function(index) {
            if (typeof index !== 'number')
                return;
            var hArr = _getHeadingArray(this);
            var column = hArr[index];
            if (typeof column == "undefined")
                return;
            var key = _getKey(column);
            var i, row;
            var rowArr = _getRows(this);
            if (index == 0) {
                hArr.shift();
                for (i = 0; i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = 0; i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).shift();
                    _getValueMap(row)[key] = undefined;
                }
            } else if (index < hArr.length) {
                hArr.splice(index, 1);
                for (i = index; i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = index; i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).splice(index, 1);
                    _getValueMap(row)[key] = undefined;
                }
            } else {
                hArr.pop();
                for (i = 0; i < hArr.length; i++)
                    _setIndex(hArr[i], i);
                for (i = 0; i < rowArr.length; i++) {
                    row = rowArr[i];
                    _getValueArray(row).pop();
                    _getValueMap(row)[key] = undefined;
                }
            }
            for (i = 0; i < hArr.length; i++) {
                var h = hArr[i];
                var wc = _getWidestCell(h);
                if (typeof wc !== 'undefined' && _getKey(_getHeading(wc)) == key)
                    _resetWidestCell(h);
            }
            return key;
        },
        /**
         * @returns {number}
         * @this {MarkdownTableBuilder}
         */
        getRowCount: function() {
            return _getRows(this).length;
        },
        /**
         * @returns {Iterator<MarkdownTableRowAccessor>}
         * @this {MarkdownTableBuilder}
         */
        getRows: function() {
            return _getRows(this)[Symbol.iterator]();
        },
        /**
         * @param {number} rowIndex 
         * @param {(string | symbol)} key 
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableBuilder}
         */
        getCell: function(rowIndex, key) {
            var row = _getRows(this)[rowIndex];
            if (typeof row !== 'undefined')
                return row.getCell(key);
        },
        /**
         * @param {number} rowIndex 
         * @param {number} columnIndex 
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableBuilder}
         */
        getCellAt: function(rowIndex, columnIndex) {
            var row = _getRows(this)[rowIndex];
            if (typeof row !== 'undefined')
                return row.getCellAt(columnIndex);
        },
        /**
         * @param {number} rowIndex 
         * @param {(string | symbol)} key 
         * @param {boolean} rawValue 
         * @returns {(string | undefined)}
         * @this {MarkdownTableBuilder}
         */
        getCellValue: function(rowIndex, key, rawValue) {
            var row = _getRows(this)[rowIndex];
            if (typeof row !== 'undefined')
                return row.getCell(key, rawValue);
        },
        /**
         * @param {number} rowIndex 
         * @param {number} columnIndex 
         * @param {boolean} rawValue 
         * @returns {(string | undefined)}
         * @this {MarkdownTableBuilder}
         */
        getCellValueAt: function(rowIndex, columnIndex, rawValue) {
            var row = _getRows(this)[rowIndex];
            if (typeof row !== 'undefined')
                return row.getCellAt(columnIndex, rawValue);
        },
        /**
         * @param {number} rowIndex 
         * @param {(string | symbol)} key 
         * @param {(MarkdownTableCellSpec | string)} value 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableBuilder}
         */
        setCellValue: function(rowIndex, key, value, escapingOption) {
            var row = _getRows(this)[rowIndex];
            if (typeof row === 'undefined')
                throw new Error("Row index out of range");
            return row.setCellValue(key, value, escapingOption);
        },
        /**
         * @param {number} rowIndex 
         * @param {number} columnIndex 
         * @param {(MarkdownTableCellSpec | string)} value 
         * @param {MarkdownTableCellEscapeOption} [escapingOption] 
         * @returns {MarkdownTableCellAccessor}
         * @this {MarkdownTableBuilder}
         */
        setCellValueAt: function(rowIndex, columnIndex, value, escapingOption) {
            var row = _getRows(this)[rowIndex];
            if (typeof row === 'undefined')
                throw new Error("Row index out of range");
            return row.setCellValueAt(columnIndex, value, escapingOption);
        },
        /**
         * @param {number} index 
         * @returns {(MarkdownTableRowAccessor | undefined)}
         * @this {MarkdownTableBuilder}
         */
        getRowAt: function(index) {
            return _getRows(this)[index];
        },
        /**
         * @returns {boolean}
         * @this {MarkdownTableBuilder}
         */
        getAutoAddColumnsOnNewRow: function() {
            return this[S_autoAddColumnsOnNewRow];
        },
        /**
         * @param {boolean} enabled 
         * @this {MarkdownTableBuilder}
         */
        setAutoAddColumnsOnNewRow: function(enabled) {
            this[S_autoAddColumnsOnNewRow] = enabled == true;
        },
        /**
         * @param {Record<string | symbol, any>} [source] 
         * @returns {MarkdownTableRowAccessor}
         * @this {MarkdownTableBuilder}
         */
        addRow: function(source) {
            var rowArr = _getRows(this);
            var row = new MarkdownTableRowAccessor(this, rowArr.length);
            rowArr.push(row);
            var i, h, c, w, value;
            var hArr = _getHeadingArray(this);
            if (typeof source == 'undefined')
                for (i = 0; i < hArr.length; i++) {
                    h = hArr[i];
                    c = new MarkdownTableCellAccessor(h, row, _getDefaultValue(h));
                    _getValueArray(row).push(c);
                    _getValueMap(row)[_getKey(h)] = c;
                    w = h.calculateWidth();
                    if (w < c.calculateMinWidth())
                        _setWidestCell(h, c);
                }
            else {
                var k;
                for (i = 0; i < hArr.length; i++) {
                    k = _getKey(h);
                    h = hArr[i];
                    c = new MarkdownTableCellAccessor(h, row, coerceToString(source[k], _getDefaultValue(h)));
                    _getValueArray(row).push(c);
                    _getValueMap(row)[k] = c;
                    w = h.calculateWidth();
                    if (w < c.calculateMinWidth())
                        _setWidestCell(h, c);
                }
                if (this[S_autoAddColumnsOnNewRow]) {
                    var oPn = Object.getOwnPropertyNames(source);
                    for (i = 0; i < oPn.length; i++) {
                        k = oPn[i];
                        value = source[k];
                        switch (typeof value) {
                            case "function":
                            // case "symbol":
                                break;
                            default:
                                h = this.getHeading(pn);
                                if (typeof h == 'undefined') {
                                    h = this.addColumn(pn);
                                    c = new MarkdownTableCellAccessor(h, row, coerceToString(value));
                                    _getValueArray(row).push(c);
                                    _getValueMap(row)[k] = c;
                                    w = h.calculateWidth();
                                    if (w < c.calculateMinWidth())
                                        _setWidestCell(h, c);
                                }
                                break;
                        }
                    }
                }
            }
            return row;
        },
        /**
         * @param {number} index 
         * @param {Record<string | symbol, any>} source 
         * @returns {MarkdownTableRowAccessor}
         * @this {MarkdownTableBuilder}
         */
        insertRow: function(index, source) {
            if (typeof index !== 'number' || isNaN(index) || index < 0)
                throw new Error("Index out of range");
            var row, i, h, c, w;
            var rowArr = _getRows(this);
            if (index >= rowArr.length) {
                row = new MarkdownTableRowAccessor(this, rowArr.length);
                rowArr.push(row);
            } else {
                row = new MarkdownTableRowAccessor(this, index);
                if (index == 0)
                    rowArr.unshift(row);
                else
                    rowArr.splice(index, 0, row);
            }
            var valueArr = _getValueArray(row);
            var valueMap = _getValueMap(row);
            var hArr = _getHeadingArray(this);
            if (typeof source == 'undefined')
                for (i = 0; i < hArr.length; i++) {
                    h = hArr[i];
                    c = new MarkdownTableCellAccessor(h, row, _getDefaultValue(h));
                    valueArr.push(c);
                    valueMap[_getKey(h)] = c;
                    w = h.calculateWidth();
                    if (w < c.calculateMinWidth())
                        _setWidestCell(h, c);
                }
            else {
                var k;
                for (i = 0; i < hArr.length; i++) {
                    k = _getKey(h);
                    h = hArr[i];
                    c = new MarkdownTableCellAccessor(h, row, coerceToString(source[k], _getDefaultValue(h)));
                    _getValueArray(row).push(c);
                    _getValueMap(row)[k] = c;
                    w = h.calculateWidth();
                    if (w < c.calculateMinWidth())
                        _setWidestCell(h, c);
                }
                if (this[S_autoAddColumnsOnNewRow]) {
                    var oPn = Object.getOwnPropertyNames(source);
                    for (i = 0; i < oPn.length; i++) {
                        k = oPn[i];
                        value = source[k];
                        switch (typeof value) {
                            case "function":
                            // case "symbol":
                                break;
                            default:
                                h = this.getHeading(pn);
                                if (typeof h == 'undefined') {
                                    h = this.addColumn(pn);
                                    c = new MarkdownTableCellAccessor(h, row, coerceToString(value));
                                    _getValueArray(row).push(c);
                                    _getValueMap(row)[k] = c;
                                    w = h.calculateWidth();
                                    if (w < c.calculateMinWidth())
                                        _setWidestCell(h, c);
                                }
                                break;
                        }
                    }
                }
            }
            return row;
        },
        /**
         * @param {(number | (row: MarkdownTableRowAccessor) => boolean)} startIndex 
         * @param {*} [length] 
         * @this {MarkdownTableBuilder}
         */
        removeRows: function(startIndex, length) {
            var i, h, k, row;
            var rowArr = _getRows(this);
            if (typeof startIndex == 'function') {
                if (rowArr.length == 0)
                    return 0;
                var count = 0;
                var index = 0;
                var wc;
                var hArr = _getHeadingArray(this);
                if (arguments.length == 1) {
                    while (index < rowArr.length) {
                        row = rowArr[index];
                        if (startIndex(row)) {
                            rowArr.splice(index, 1);
                            count++;
                            for (i = 0; i < hArr.length; i++) {
                                h = hArr[i];
                                wc = _getWidestCell(h);
                                if (typeof wc != 'undefined' && _getKey(_getHeading(wc)) == _getKey(_getHeading(_getValueArray(row)[i])))
                                    _resetWidestCell(h);
                            }
                        } else
                            index++;
                    }
                } else {
                    while (index < rowArr.length) {
                        row = rowArr[index];
                        if (startIndex.call(length, row)) {
                            rowArr.splice(index, 1);
                            count++;
                            for (i = 0; i < hArr.length; i++) {
                                h = hArr[i];
                                wc = _getWidestCell(h);
                                if (typeof wc != 'undefined' && _getKey(_getHeading(wc)) == _getKey(_getHeading(_getValueArray(row)[i])))
                                    _resetWidestCell(h);
                            }
                        } else
                            index++;
                    }
                }
                return count;
            }
            if (typeof startIndex != 'number') {
                if (typeof startIndex !== 'undefined' && startIndex !== null)
                    throw new Error("Invalid startIndex");
                if (typeof length != 'number') {
                    if (typeof length != 'undefined' && length !== null)
                        throw new Error("Invalid length");
                    return;
                }
                if (rowArr.length == 0 || isNaN(length) || length < 1)
                    return;
                startIndex = 0;
                if (length > rowArr.length)
                    length = rowArr.length;
            } else if (isNaN(startIndex) || startIndex < 0) {
                if (typeof length != 'number') {
                    if (typeof length != 'undefined' && length !== null)
                        throw new Error("Invalid length");
                    return;
                }
                if (rowArr.length == 0 || isNaN(length) || length < 1)
                    return;
                startIndex = 0;
                if (length > rowArr.length)
                    length = rowArr.length;
            } else {
                if (typeof length != 'number') {
                    if (typeof length != 'undefined' && length !== null)
                        throw new Error("Invalid length");
                    if (rowArr.length == 0)
                        return;
                    length = rowArr.length - startIndex;
                } else {
                    if (rowArr.length == 0)
                        return;
                    if (isNaN(length))
                        length = rowArr.length - startIndex;
                    else {
                        if (startIndex > rowArr.length)
                            return;
                        var diff = (startIndex + length) - rowArr.length;
                        if (diff > 0)
                            length -= diff;
                    }
                }
                if (length < 1)
                    return;
            }
            var removed = rowArr.splice(startIndex, length);
            for (i = 0; i < removed.length; i++) {
                row = removed[i];
                var valueArr = _getValueArray(row);
                for (var n = 0; n < valueArr.length; n++) {
                    var c = valueArr[n];
                    wc = _getWidestCell(_getHeading(c));
                    if (typeof wc != 'undefined' && _getIndex(_getRow(wc)) == _getIndex(_getRow(c)))
                        _resetWidestCell(wc);
                }
            }
            for (i = startIndex; i < rowArr.length; i++)
                _setIndex(rowArr[i], i);
        },
        /**
         * @this {MarkdownTableBuilder}
         */
        clearRows: function() {
            var hArr = _getHeadingArray(this);
            hArr.splice(0, hArr.length);
            for (var i = 0; i < hArr.length; i++)
                _setWidestCell(hArr[i], undefined);
        },
        /**
         * @param {(a: MarkdownTableRowAccessor, b: MarkdownTableRowAccessor) => number} compareFn 
         * @param {*} [thisObj] 
         * @this {MarkdownTableBuilder}
         */
        sort: function(compareFn, thisObj) {
            if (_getRows(this).length < 1)
                return;
            if (arguments.length == 1)
                _getRows(this).sort(compareFn);
            else
                _getRows(this).sort(function(a, b) { return compareFn.call(thisObj, a, b); });
        },
        /**
         * @returns {string}
         * @this {MarkdownTableBuilder}
         */
        getMarkdown: function() {
            var rowArr = _getRows(this);
            if (rowArr.length == 0)
                return '';
            var hArr = _getHeadingArray(this);
            var widths = hArr.map(function(h) {
                var w = h.calculateWidth() + 1;
                switch (_getAlign(h)) {
                    case "center":
                        return (w < 5) ? 5 : w;
                    case "left":
                    case "right":
                        return (w < 4) ? 4 : w;
                    default:
                        return (w < 3) ? 3 : w;
                }
            });
            var i;
            var line = '|';
            for (i = 0; i < widths.length; i++)
                line += ' ' + hArr[i].toString() + getPadChars(' ', widths[i]) + '|';
            var allLines = [line];
            line = '|';
            for (i = 0; i < widths.length; i++) {
                switch (_getAlign(hArr[i])) {
                    case "center":
                        line += ' :' + getPadChars('-', widths[i] - 3) + ': |';
                        break;
                    case "left":
                        line += ' ' + getPadChars('-', widths[i] - 2) + ' |';
                        break;
                    case "right":
                        line += ' :' + getPadChars('-', widths[i] - 2) + ': |';
                        break;
                    default:
                        line += ' ' + getPadChars('-', widths[i] - 1) + ' |';
                        break;
                }
            }
            allLines.push(line);
            for (i = 0; i < rowArr.length; i++) {
                var row = rowArr[i];
                line = '|';
                for (var n = 0; n < widths.length; n++)
                    line += ' ' + _getValueArray(row)[n].toString() + getPadChars(' ', widths[n]) + '|';
                allLines.push(line);
            }

            return allLines.join("\n");
        },

        type: 'MarkdownTableBuilder'
    };

    MarkdownTableBuilderContructor.MarkdownTableColumHeadingAccessor = MarkdownTableColumHeadingAccessor;

    MarkdownTableBuilderContructor.MarkdownTableCellAccessor = MarkdownTableCellAccessor;

    MarkdownTableBuilderContructor.MarkdownTableRowAccessor = MarkdownTableRowAccessor;

    /**
     * @param {number} index 
     * @param {(string | symbol | AnyMarkdownTableColumnHeadingSpec)} key 
     * @param {(string | MarkdownTableCellEscapeOption)} [headingText] 
     * @param {MarkdownTableCellEscapeOption} [escapingOption] 
     * @returns {MarkdownTableColumHeadingAccessor}
     * @this {MarkdownTableBuilder}
     */
    MarkdownTableBuilderContructor.prototype[S_createColumn] = function(index, key, headingText, escapingOption) {
        /** @type {MarkdownTableColumHeadingAccessor} */
        var column;
        switch (typeof key) {
            case 'string':
                column = new MarkdownTableColumHeadingAccessor(key, index, headingText, key, escapingOption, "default", this);
                break;
            case 'symbol':
                column = new MarkdownTableColumHeadingAccessor(key, index, headingText, '', escapingOption, "default", this);
                break;
            case 'undefined':
                column = new MarkdownTableColumHeadingAccessor('', index, headingText, '', escapingOption, "default", this);
                break;
            case 'object':
                if (key === null)
                    column = new MarkdownTableColumHeadingAccessor('', index, headingText, '', escapingOption, "default", this);
                else
                    switch (typeof key.key) {
                        case 'symbol':
                            column = new MarkdownTableColumHeadingAccessor(key.key, index, key.heading, key.defaultValue, key.escapingOption, key.align, this);
                            break;
                        case 'undefined':
                            column = new MarkdownTableColumHeadingAccessor('', index, key.heading, key.defaultValue, key.escapingOption, key.align, this);
                            break;
                        default:
                            column = new MarkdownTableColumHeadingAccessor(key.key, index, key.heading, (typeof key.defaultValue == 'undefined') ? key.key : key.defaultValue, key.escapingOption, key.align, this);
                            break;
                    }
                break;
            default:
                column = new MarkdownTableColumHeadingAccessor('', index, headingText, '', escapingOption, "default", this);
                break;
        }
        if (typeof _getHeadingMap(this)[_getKey(column)] !== 'undefined')
            throw new Error("That key already exists");
        /** @type {MarkdownTableColumHeadingAccessor} */
        _getHeadingMap(this)[_getKey(column)] = column;
        return column;
    };

    return MarkdownTableBuilderContructor;
})();