
var QueryConditionParser = (function() {
    var S_conditions_sets = Symbol();
    var S_conditions = Symbol();
    var S_options = Symbol();
    var S_name = Symbol();
    var S_type = Symbol();
    var S_operator = Symbol();
    var S_values = Symbol();
    var S_index = Symbol();
    var S_parent = Symbol();

    var trailingWsRe = /\s$/;
    var idRe = /IO:([a-f\d]{32})/g;
    var encodedReOld = /^([^^]+(?:\^(?!NQ)[^^]+)*)\^NQ ?/g;
    var queryStringRe = /^([^^]+(?:\^\^[^^]*)*)\^(OR|NQ)?(.+)?/g;
    var queryConditionRe = /^(.+?)(!?=|[<>]=?|CONTAINS|DOES NOT CONTAIN|INSTANCEOF|BETWEEN|CHANGES(?:FROM|TO)|DATEPART|DOESNOTHAVE|DYNAMIC|(?:START|END)SWITH|(?:ANYTH|EMPTYSTR|EXCLUD)ING|IN|IN_HIERARCHY(?:_DYNAMIC)?|(?:IS(?:NOT)?)EMPTY|(?:LESS|MORE)THAN|LIKE|[GL]T_(?:OR_EQUALS_)?FIELD|NOT(?: (?:IN|LIKE)|EMPTY|ON)|N?SAMEAS|ON|RELATIVE[LG]T|VALCHANGES)(.+)?$/;

    /** @type {QueryOperator[]} */
    var allQueryOperators = ["!=", "<", "<=", "=", ">", ">=", "ANYTHING", "BETWEEN", "CHANGESFROM", "CHANGESTO", "CONTAINS", "DATEPART", "DOES NOT CONTAIN", "DOESNOTHAVE", "DYNAMIC", "EMPTY", "EMPTYSTRING", "ENDSWITH", "EXCLUDING", "GT_FIELD",
        "GT_OR_EQUALS_FIELD", "IN", "IN_HIERARCHY", "IN_HIERARCHY_DYNAMIC", "INSTANCEOF", "ISEMPTY", "ISNOTEMPTY", "LESSTHAN", "LIKE", "LT_FIELD", "LT_OR_EQUALS_FIELD", "MORETHAN", "NOT IN", "NOT LIKE", "NOTEMPTY", "NOTON", "NSAMEAS", "ON", "RELATIVELT",
        "RELATIVEGT", "SAMEAS", "STARTSWITH", "VALCHANGES"];
        
    function coerceToString(value, defaultValue) {
        switch (typeof value) {
            case "string":
                return (value == '') ? defaultValue : value;
            case 'bigint':
            case 'boolean':
            case 'number':
                return '' + value;
            case 'object':
                return (value !== null) ? '' + value : defaultValue;
            default:
                return defaultValue;
        }
    }
    
    /**
     * 
     * @param {QueryOperator} operator 
     * @returns {QueryOperatorType}
     */
    function getOperatorType(operator) {
        switch (operator) {
            case "ANYTHING":
            case "ISEMPTY":
            case "ISNOTEMPTY":
            case "EMPTY":
            case "NOTEMPTY":
            case "VALCHANGES":
                return "unary";
            case "IN":
            case "NOT IN":
                return "multi-value";
            case "BETWEEN":
                return "range";
            case "SAMEAS":
            case "NSAMEAS":
            case "GT_FIELD":
            case "GT_OR_EQUALS_FIELD":
            case "LT_FIELD":
            case "LT_OR_EQUALS_FIELD":
                return "field";
            case "NOTON":
            case "ON":
            case "DATEPART":
            case "RELATIVELT":
            case "RELATIVEGT":
            case "MORETHAN":
            case "LESSTHAN":
                return "date";
            case "DYNAMIC":
            case "IN_HIERARCHY":
            case "IN_HIERARCHY_DYNAMIC":
                return "dynamic";
            case "!=":
            case "<":
            case "<=":
            case "=":
            case ">":
            case ">=":
            case "CHANGESFROM":
            case "CHANGESTO":
            case "CONTAINS":
            case "DOES NOT CONTAIN":
            case "DOESNOTHAVE":
            case "EMPTYSTRING":
            case "ENDSWITH":
            case "EXCLUDING":
            case "INSTANCEOF":
            case "LIKE":
            case "NOT LIKE":
            case "STARTSWITH":
                return "value";
            default:
                throw new Error(JSON.stringify(operator) + " is not a valid operator.");
        }
    }
    
    /**
     * 
     * @param {QueryOperator} operator 
     * @returns {string}
     */
    function getOperatorDislayText(operator) {
        switch (operator) {
            case "!=":
                return "is not";
            case "<":
                return "less than";
            case "<=":
                return "less than or is";
            case "=":
                return "is";
            case ">":
                return "greater than";
            case ">=":
                return "greater than or is";
            case "ANYTHING":
                return "is anything";
            case "BETWEEN":
                return "is between";
            case "CHANGESFROM":
                return "changes from";
            case "CHANGESTO":
                return "changes to";
            case "DATEPART":
                return "trend";
            case "DOESNOTHAVE":
                return "does not have";
            case "DYNAMIC":
                return "is (dynamic)";
            case "EMPTYSTRING":
                return "is empty string";
            case "ENDSWITH":
                return "ends with";
            case "GT_FIELD":
                return "greater than field";
            case "GT_OR_EQUALS_FIELD":
                return "greater than or is field";
            case "IN_HIERARCHY_DYNAMIC":
                return "is in hierarchy (dynamic)";
            case "IN_HIERARCHY":
                return "is in hierarchy";
            case "IN":
                return "is one of";
            case "INSTANCEOF":
                return "instsance of";
            case "EMPTY":
            case "ISEMPTY":
                return "is empty";
            case "NOTEMPTY":
            case "ISNOTEMPTY":
                return "is not empty";
            case "LESSTHAN":
                return "is less than";
            case "LIKE":
                return "contains";
            case "LT_FIELD":
                return "less than field";
            case "LT_OR_EQUALS_FIELD":
                return "less than or is field";
            case "MORETHAN":
                return "is more than";
            case "NOT IN":
                return "is not one of";
            case "NOT LIKE":
                return "does not contain";
            case "NOTON":
                return "not on";
            case "NSAMEAS":
                return "is different from ";
            case "RELATIVEGT":
                return "Relative (after)";
            case "RELATIVELT":
                return "Relative (before)";
            case "SAMEAS":
                return "is same as";
            case "STARTSWITH":
                return "starts with";
            case "VALCHANGES":
                return "changes";
            default:
                return operator.toLowerCase();
        }
    }

    /** @type {QueryConditionParserConstructor} */
    var QueryConditionParserConstructor = Class.Create();
    
    /** @type {({ new(name: string, operator: QueryOperator, value?: string | null): QueryConditionOption; })} */
    var QueryConditionOption = Class.create();
    QueryConditionOption.prototype = {
        /**
         * @param {string} name 
         * @param {QueryOperator} operator 
         * @param {(string | null)} [value] 
         * @this {QueryConditionOption}
         */
        initialize: function(name, operator, value) {
            value = coerceToString(value, '').replace('^^', '^');
            var type = getOperatorType(operator);
            switch (type) {
                case "unary":
                    if (value != '')
                        throw new Error("Unexpected value following unary operator");
                    this[S_values] = [];
                    break;
                case "multi-value":
                    this[S_values] = value.split(',');
                    break;
                case "range":
                    if (value == '')
                        throw new Error("No value following " + JSON.stringify(operator) + " operator.");
                    this[S_values] = value.split('@', 2);
                    if (this[S_values].length != 2)
                        throw new Error("Second value missing following " + JSON.stringify(operator) + " operator.");
                    break;
                case "date":
                case "dynamic":
                case "field":
                    if (value == '')
                        throw new Error("No value following " + JSON.stringify(operator) + " operator.");
                    this[S_values] = [value];
                    break;
                default:
                    this[S_values] = [value];
                    break;
            }
            this[S_name] = coerceToString(name, '').split('.');
            this[S_type] = type;
            this[S_operator] = operator;
            if (typeof value === 'string') {
                if (type == "unary")
                this[S_values] = value.replace('^^', '^');
            } else if (type !== "unary")
                this[S_values] = '';
        },

        /**
         * @param {number} [index] 
         * @returns {string}
         * @this {QueryConditionOption}
         */
        getName: function(index) {
            if (arguments.length < 1) {
                var name = this[S_name];
                return (name.length < 2) ? name[0] : name.join('.');
            }
            return this[S_name][index];
        },
        
        /**
         * @returns {QueryOperator}
         * @this {QueryConditionOption}
         */
        getOperator: function() {
            return this[S_operator];
        },
        
        /**
         * @this {QueryConditionOption}
         * @returns {QueryOperatorType}
         * @this {QueryConditionOption}
         */
        getType: function() {
            return this[S_type];
        },

        getValueCount: function() {
            return this[S_values].length;
        },
        
        /**
         * @param {number} [index] 
         * @returns {string}
         * @this {QueryConditionOption}
         */
        getValue: function(index) {
            if (arguments.length < 1) {
                var values = this[S_values];
                return (values.length < 2) ? values[0] : values.join((this[S_type] == "range") ? '@' : ',');
            }
            return this[S_values][index];
        },
        
        /**
         * 
         * @param {string} [fieldReplace] 
         * @param {string} [valueReplace] 
         * @this {QueryConditionOption}
         */
        getDisplayValue: function(fieldReplace, valueReplace) {
            var type = this[S_type];
            if (type == "unary")
                return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' ' + getOperatorDislayText(this[S_operator]);
            if (typeof valueReplace == 'string')
                return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' ' + getOperatorDislayText(this[S_operator]) + ' ' + valueReplace;
            var values = this[S_values];
            var operator = this[S_operator];
            switch (operator) {
                case "!=":
                    if (values.length == 1 && values[0] == '')
                        return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' is not empty';
                    break;
                case "=":
                    if (values.length == 1 && values[0] == '')
                        return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' is empty';
                    break;
            }
            switch (type) {
                case "range":
                    return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' ' + getOperatorDislayText(operator) + values.map(JSON.stringify).join(" and ");
                case "multi-value":
                    return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' ' + getOperatorDislayText(operator) + values.map(JSON.stringify).join(", ");
                default:
                    return ((typeof fieldReplace == 'string') ? fieldReplace : this.getName()) + ' ' + getOperatorDislayText(operator) + JSON.stringify(values[0]);
            }
        },

        type: "QueryConditionOption"
    };

    /** @type {({ new(name: string, operator: QueryOperator, value?: string | null): QueryCondition; })} */
    var QueryCondition = Class.create();
    QueryCondition.prototype = {
        /**
         * @param {string} name 
         * @param {QueryOperator} operator 
         * @param {(string | null)} [value] 
         */
        initialize: function(name, operator, value) {
            this[S_options] = [new QueryConditionOption(name, operator, value)];
        },

        /**
         * @param {string} name 
         * @param {QueryOperator} operator 
         * @param {*} value 
         */
        add: function(name, operator, value) {
            this[S_options].push(new QueryConditionOption(name, operator, value));
        },
        
        getCount: function() {
            return this[S_options].length;
        },

        get: function(index) {
            return this[S_options][index];
        },

        getAll: function() {
            return this[S_options][Symbol.iterator]();
        },

        toArray: function() {
            return this[S_options].slice();
        },

        /**
         * @param {({ (item: QueryConditionOption, index: number): void; })} callbackfn 
         * @param {*} thisArg 
         */
        foreach: function(callbackfn, thisArg) {
            /** @type {QueryConditionOption[]} */
            var arr = this[S_options];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    callbackfn.call(thisArg, arr[index], index);
            else
                for (index = 0; index < arr.length; index++)
                    callbackfn(arr[index], index);
        },

        /**
         * @param {({ (item: QueryConditionOption, index: number): any; })} callbackfn 
         * @param {*} thisArg 
         * @returns {[]}
         */
        map: function(callbackfn, thisArg) {
            /** @type {QueryConditionOption[]} */
            var arr = this[S_options];
            var results = [];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn.call(thisArg, arr[index], index));
            else
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn(arr[index], index));
            return results;
        },

        type: "QueryCondition"
    };

    QueryConditionParserConstructor.QueryCondition = QueryCondition;
    
    /** @type {({ new(condition: QueryCondition): ConditionSet; })} */
    var ConditionSet = Class.create();

    ConditionSet.prototype = {
        /**
         * @param {QueryCondition} condition 
         */
        initialize: function(condition) {
            this[S_conditions] = [condition];
        },

        add: function(condition) {
            this[S_conditions].push(condition);
        },
        
        getCount: function() {
            return this[S_conditions].length;
        },

        get: function(index) {
            return this[S_conditions][index];
        },

        getAll: function() {
            return this[S_conditions][Symbol.iterator]();
        },

        toArray: function() {
            return this[S_conditions].slice();
        },

        /**
         * @param {({ (item: QueryCondition, index: number): void; })} callbackfn 
         * @param {*} thisArg 
         */
        foreach: function(callbackfn, thisArg) {
            /** @type {QueryCondition[]} */
            var arr = this[S_conditions];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    callbackfn.call(thisArg, arr[index], index);
            else
                for (index = 0; index < arr.length; index++)
                    callbackfn(arr[index], index);
        },

        /**
         * @param {({ (item: QueryCondition, index: number): any; })} callbackfn 
         * @param {*} thisArg 
         * @returns {[]}
         */
        map: function(callbackfn, thisArg) {
            /** @type {QueryCondition[]} */
            var arr = this[S_conditions];
            var results = [];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn.call(thisArg, arr[index], index));
            else
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn(arr[index], index));
            return results;
        },

        type: "ConditionSet"
    };

    QueryConditionParserConstructor.ConditionSet = ConditionSet;
    
    QueryConditionParserConstructor.prototype = {
        queryConditionAndOperatorText: '*and*',

        queryConditionOrOperatorText: '*OR*',

        conditionSetOrOperatorText: '**OR**',

        comparisonOperatorMap: {},

        /**
         * Called during construction.
         * 
         * @param {string} queryString - The query string to parse
         * @this {QueryConditionParser}
         */
        initialize: function(queryString) {
            allQueryOperators.forEach(function(op) {
                this.comparisonOperatorMap[op] = getOperatorDislayText(op);
            }, this);
            queryString = coerceToString(queryString).trim();
            if (queryString == '') {
                this[S_conditions_sets] = [];
                return;
            }
            var setMatch = queryStringRe.exec(queryString);
            /** @type {(RegExpExecArray | null)} */
            var conditionMatch;
            /** @type {QueryCondition} */
            var lastCondition;
            if (setMatch === null) {
                conditionMatch = queryConditionRe.exec(queryString);
                if (conditionMatch === null)
                    throw new Error("Could not parse query string: Valid operator not found.");
                try {
                    lastCondition = new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                } catch (e) {
                    throw new Error("Could not parse query string:" + e);
                }
                this[S_conditions_sets] = [new ConditionSet(lastCondition)];
                return;
            }
            conditionMatch = queryConditionRe.exec(setMatch[1]);
            if (conditionMatch === null)
                throw new Error("Could not parse query string: Valid operator not found.");
            try {
                qc = new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
            } catch (e) {
                throw new Error("Could not parse query string:" + e);
            }
            var currentSet = new ConditionSet(lastCondition);
            /** @type {ConditionSet[]} */
            var conditionSets = [currentSet];
            
            var charIndex = 0;
            while (setMatch[3] !== null) {
                charIndex += ((setMatch[2] === null) ? setMatch[1].length : setMatch[1].length + setMatch[2].length) + 1;
                /** @type {("OR" | "NQ" | null)} */
                var logicalOp = setMatch[2];
                queryString = setMatch[3];
                setMatch = queryStringRe.exec(queryString);
                if (setMatch === null) {
                    conditionMatch = queryConditionRe.exec(queryString);
                    if (conditionMatch === null)
                        throw new Error("Could not parse query string at index " + charIndex + ": Valid operator not found.");
                    try {
                        if (logicalOp === null) {
                            lastCondition = new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                            currentSet.add(lastCondition);
                        } else if (logicalOp === "OR")
                            lastCondition.add(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                        else
                            conditionSets.push(new ConditionSet(new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3])));
                    } catch (e) {
                        throw new Error("Could not parse query string at index " + charIndex + ":" + e);
                    }
                    break;
                }
                conditionMatch = queryConditionRe.exec(setMatch[1]);
                if (conditionMatch === null)
                    throw new Error("Could not parse query string at index " + charIndex + ": Valid operator not found.");
                try {
                    if (logicalOp === null) {
                        lastCondition = new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                        currentSet.add(lastCondition);
                    } else if (logicalOp === "OR")
                        lastCondition.add(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                    else {
                        lastCondition = new QueryCondition(conditionMatch[1], conditionMatch[2], conditionMatch[3]);
                        currentSet = new ConditionSet(lastCondition);
                        conditionSets.push(currentSet);
                    }
                } catch (e) {
                    throw new Error("Could not parse query string at index " + charIndex + ":" + e);
                }
            }
            this[S_conditions_sets] = conditionSets;
        },

        add: function(conditionSet) {
            this[S_conditions_sets].push(conditionSet);
        },
        
        getCount: function() {
            return this[S_conditions_sets].length;
        },

        get: function(index) {
            return this[S_conditions_sets][index];
        },

        getAll: function() {
            return this[S_conditions_sets][Symbol.iterator]();
        },

        toArray: function() {
            return this[S_conditions_sets].slice();
        },

        /**
         * @param {({ (item: ConditionSet, index: number): void; })} callbackfn 
         * @param {*} thisArg 
         */
        foreach: function(callbackfn, thisArg) {
            /** @type {ConditionSet[]} */
            var arr = this[S_conditions_sets];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    callbackfn.call(thisArg, arr[index], index);
            else
                for (index = 0; index < arr.length; index++)
                    callbackfn(arr[index], index);
        },

        /**
         * @param {({ (item: ConditionSet, index: number): any; })} callbackfn 
         * @param {*} thisArg 
         * @returns {[]}
         */
        map: function(callbackfn, thisArg) {
            /** @type {ConditionSet[]} */
            var arr = this[S_conditions_sets];
            var results = [];
            var index;
            if (arguments.length > 1)
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn.call(thisArg, arr[index], index));
            else
                for (index = 0; index < arr.length; index++)
                    results.push(callbackfn(arr[index], index));
            return results;
        },

        /**
         * @this {QueryConditionParser}
         */
        toStringArray: function() {
            /** @type {Record<QueryOperator, string>} */
            var comparisonOperatorMap = {};
            if (typeof this.comparisonOperatorMap == 'object' && this.comparisonOperatorMap !== null)
                allQueryOperators.forEach(function(op) {
                    var d = coerceToString(this.from[op]);
                    this.to[op] = (typeof d == 'string') ? d : getOperatorDislayText(op);
                }, { from: this.comparisonOperatorMap, to: comparisonOperatorMap});
            else
                allQueryOperators.forEach(function(op) {
                    this[op] = getOperatorDislayText(op);
                }, comparisonOperatorMap);
            var queryConditionAndOperatorText = coerceToString(this.queryConditionAndOperatorText, "*AND*");
            var queryConditionOrOperatorText = coerceToString(this.queryConditionOrOperatorText, "*OR*");
            var conditionSetOrOperatorText = coerceToString(this.conditionSetOrOperatorText, "**OR**");
            var beforeEmitConditionSet = this.beforeEmitConditionSet;
            var beforeEmitQueryCondition = this.beforeEmitQueryCondition;
            var beforeEmitQueryConditionOption = this.beforeEmitQueryConditionOption;
            var afterEmitQueryConditionOption = this.afterEmitQueryConditionOption;
            var afterEmitQueryCondition = this.afterEmitQueryCondition;
            var afterEmitConditionSet = this.afterEmitConditionSet;
            var fieldEncode = this.fieldEncode;
            var comparisonOperatorEncode = this.comparisonOperatorEncode;
            var valueEncode = this.valueEncode;
            /** @type {ConditionOptionContext} */
            var context = {
                currentLine: '',
                emittedLines: []
            };
            this[S_conditions_sets].forEach(
                /**
                 * @param {ConditionSet} currentSet 
                 * @param {number} setIndex 
                 * @this {QueryConditionParser}
                 */
                function(currentSet, setIndex) {
                    context.currentSet = currentSet;
                    context.setIndex = setIndex;
                    if (setIndex > 0&& context.currentLine.length > 0)
                        context.emittedLines.push(context.currentLine);
                    if (typeof beforeEmitConditionSet === 'function')
                        beforeEmitConditionSet(context);
                    if (setIndex > 0) {
                        if (context.currentLine.length > 0 && !trailingWsRe.test(context.currentLine))
                            context.currentLine += ' ';
                        context.currentLine += conditionSetOrOperatorText;
                    }
                    currentSet.forEach(
                        /**
                         * @param {QueryCondition} currentQuery 
                         * @param {number} queryIndex 
                         * @this {QueryConditionParser}
                         */
                        function(currentQuery, queryIndex) {
                            context.currentQuery = currentQuery;
                            context.queryIndex = queryIndex;
                            if (typeof beforeEmitQueryCondition === 'function')
                                beforeEmitQueryCondition(context);
                            if (context.currentLine.length > 0 && !trailingWsRe.test(context.currentLine))
                                context.currentLine += ' ';
                            if (queryIndex > 0)
                                context.currentLine += queryConditionAndOperatorText + ' ';
                            /**
                             * @param {QueryConditionOption} current 
                             * @param {number} index 
                             * @this {QueryConditionParser}
                             */
                            currentQuery.forEach(
                                function(current, index) {
                                    context.currentQueryOption = current;
                                    context.optionIndex = index;
                                    if (typeof beforeEmitQueryConditionOption === 'function')
                                        beforeEmitQueryConditionOption(context);
                                    if (context.currentLine.length > 0 && !trailingWsRe.test(context.currentLine))
                                        context.currentLine += ' ';
                                    if (index > 0)
                                        context.currentLine += queryConditionOrOperatorText + ' ';
                                    var display_text;
                                    if (typeof fieldEncode === 'function') {
                                        display_text = coerceToString(fieldEncode(context)).trim();
                                        if (display_text == '')
                                            display_text = current.getName();
                                    } else
                                        display_text = current.getName();
                                    context.currentLine += display_text + ' ';
                                    var d = getOperatorDislayText(current.getOperator());
                                    if (typeof comparisonOperatorEncode === 'function') {
                                        display_text = coerceToString(comparisonOperatorEncode(d, context)).trim();
                                        if (display_text == '')
                                            display_text = d;
                                    } else
                                        display_text = d;
                                    context.currentLine += display_text + ' ';
                                    if (typeof valueEncode === 'function') {
                                        display_text = coerceToString(valueEncode(context)).trim();
                                        if (display_text == '')
                                            display_text = current.getValue();
                                    } else
                                        display_text = current.getValue();
                                    context.currentLine += display_text;
                                    if (typeof afterEmitQueryConditionOption === 'function')
                                        afterEmitQueryConditionOption(context);
                                }, this
                            );
                            if (typeof afterEmitQueryCondition === 'function')
                                afterEmitQueryCondition(context);
                        }, this
                    );
                    if (typeof afterEmitConditionSet === 'function')
                        afterEmitConditionSet(context);
                }, this
            );
            if (context.currentLine.length > 0)
                context.emittedLines.push(context.currentLine);
            return context.emittedLines;
        },

        type: "QueryConditionParser"
    };

    QueryConditionParserConstructor.getOperatorDislayText = getOperatorDislayText;

    return QueryConditionParserConstructor;
})();