/** @type {LTEDevHelperConstructor} */
var LTEDevHelper = (function() {
    var instanceUri = gs.getProperty('glide.servlet.uri'); // Gets the base URL of your instance

    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @returns {string}
     */
    function escapeForMarkdown(text, isTableCellContent) {
        return isTableCellContent ? text.replace(markdownTableReservedRe, '\\$&') : text.replace(markdownReservedRe, '\\$&').replace(markdownLeadReservedRe, '\\$&');
    }

    var lValueAndCompareOpRe = /^(.+?)(!?=|(?:<|>)=?|(?:NOT )?(?:IN|LIKE)|(?:START|END)SWITH|INSTANCEOF|BETWEEN|N?SAMEAS|IS(?:NOT)?EMPTY|ANYTHING|EMPTYSTRING)(.+)?$/;
    var rValueAndLogOpRe = /^([^^]*)(\^(?:NW|OR|EQ$)?)(.+)?$/;

    /**
     * @param {string} queryString
     * @param {SnQueryExpressionToken[]} arr
     * @returns {string | null}
     */
    function parseNextQueryStringToken(queryString, arr) {
        var m = queryString.match(lValueAndCompareOpRe);
        if (m) {
            var lValue = m[1];
            /** @type {SnComparisonQueryOperator} */
            var compareOp = m[2];
            queryString = m[3];
            if (queryString) {
                m = queryString.match(rValueAndLogOpRe);
                if (m) {
                    switch (compareOp) {
                        case 'ISEMPTY':
                        case 'ISNOTEMPTY':
                        case 'ANYTHING':
                        case 'EMPTYSTRING':
                            arr.push({
                                lValue: lValue,
                                operator: compareOp
                            });
                            if (m[1] != '')
                                arr.push({
                                    lValue: m[1]
                                });
                            break;
                        case 'IN':
                        case 'NOT IN':
                            arr.push({
                                lValue: lValue,
                                operator: compareOp,
                                rValue: m[1].split(',')
                            });
                            break;
                        default:
                            arr.push({
                                lValue: lValue,
                                operator: compareOp,
                                rValue: m[1]
                            });
                            break;
                    }
                    if (m[2] != '^EQ')
                        arr.push(m[2]);
                    return m[3];
                }

                switch (compareOp) {
                    case 'ISEMPTY':
                    case 'ISNOTEMPTY':
                    case 'ANYTHING':
                    case 'EMPTYSTRING':
                        arr.push({
                            lValue: lValue,
                            operator: compareOp
                        });
                        if (m[1] != '')
                            arr.push({
                                lValue: queryString
                            });
                        break;
                    case 'IN':
                    case 'NOT IN':
                        arr.push({
                            lValue: lValue,
                            operator: compareOp,
                            rValue: queryString.split(',')
                        });
                        break;
                    default:
                        arr.push({
                            lValue: lValue,
                            operator: compareOp,
                            rValue: m[1]
                        });
                        break;
                }
            } else {
                switch (compareOp) {
                    case 'ISEMPTY':
                    case 'ISNOTEMPTY':
                    case 'ANYTHING':
                    case 'EMPTYSTRING':
                        arr.push({
                            lValue: lValue,
                            operator: compareOp
                        });
                        break;
                    case 'IN':
                    case 'NOT IN':
                        arr.push({
                            lValue: lValue,
                            operator: compareOp,
                            rValue: []
                        });
                        break;
                    default:
                        arr.push({
                            lValue: lValue,
                            operator: compareOp,
                            rValue: ''
                        });
                        break;
                }
            }
        } else {
            m = queryString.match(rValueAndLogOpRe);
            if (m) {
                arr.push({
                    lValue: m[1]
                });
                if (m[2] != '^EQ')
                    arr.push(m[2]);
                return m[3];
            }

            arr.push({
                lValue: queryString
            });
        }
        return null;
    }
    /**
     *
     * @param {string} queryString
     * @returns {SnQueryExpressionToken[]}
     */
    function tokenizeQueryString(queryString) {
        /** @type {SnQueryExpressionToken[]} */
        var result = [];
        while (queryString)
            queryString = parseNextQueryStringToken(queryString, result);
        return result;
    }

    /**
     * @typedef CodeBlockText
     * @property {string} language
     * @property {string} contents
     */

    /**
     * @typedef LabelValuePair
     * @property {string} label
     * @property {CodeBlockText|string} value
     */

    /**
     * @typedef NumericVariableValue
     * @property {string} display_text
     * @property {number} value
     */

    /**
     * @typedef StringVariableValue
     * @property {string} display_text
     * @property {string} value
     */

    /**
     * @typedef OrderedVariableInfo
     * @property {StringVariableValue} name
     * @property {NumericVariableValue} order
     * @property {string} sys_id
     * @property {LabelValuePair[]} properties
     * @property {string} [additionalMarkdown]
     */

    /** @typedef {(OrderedVariableInfo & { type: NumericVariableValue; is_variable_set?: false })} OrderedQuestionItem */
    /** @typedef {(OrderedVariableInfo & { is_variable_set: true })} OrderedVariableSetItem */
    /** @typedef {(OrderedQuestionItem | OrderedVariableSetItem)} OrderedVariableItem */

    var markdownReservedRe = /[\\`*[\]()]/g;
    var markdownLeadReservedRe = /^[#|]/;
    var markdownTableReservedRe = /[\\`*[\]()|]/g;
    var newLineRe = /\n/g;
    var codeBlockReqRe = /[\n`]/g;

    /**
     * @param {LabelValuePair[]} target
     * @param {string} label
     * @param {string} value
     * @param {boolean} [force]
     */
    function addLabelValuePair(target, label, value, force) {
        if (typeof value === 'string' && value != '') {
            if (newLineRe.test(value))
                target.push({
                    label: label,
                    value: {
                        language: 'text',
                        contents: value
                    }
                });
            else
                target.push({
                    label: label,
                    value: escapeForMarkdown(value)
                });
        } else if (force)
            target.push({
                label: label,
                value: '*Empty*'
            });
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     * @param {boolean} [force]
     */
    function addElementValue(target, element, force) {
        if (element.nil()) {
            if (force)
                target.push({
                    label: element.getLabel(),
                    value: '*Empty*'
                });
        } else {
            var text = element.getValue();
            if (newLineRe.test(text))
                target.push({
                    label: element.getLabel(),
                    value: {
                        language: 'text',
                        contents: text
                    }
                });
            else
                target.push({
                    label: element.getLabel(),
                    value: escapeForMarkdown(text)
                });
        }
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     * @param {boolean} [force]
     */
    function addElementDisplayValue(target, element, force) {
        if (element.nil()) {
            if (force)
                target.push({
                    label: element.getLabel(),
                    value: '*Empty*'
                });
        } else {
            var text = element.getDisplayValue();
            if (newLineRe.test(text))
                target.push({
                    label: element.getLabel(),
                    value: {
                        language: 'text',
                        contents: text
                    }
                });
            else
                target.push({
                    label: element.getLabel(),
                    value: escapeForMarkdown(text)
                });
        }
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     * @param {boolean} [force]
     * @param {boolean} [nillAsfalse]
     */
    function addElementAsBoolean(target, element, force, nillAsfalse) {
        if (element.nil()) {
            if (force)
                target.push({
                    label: element.getLabel(),
                    value: nillAsfalse ? 'False' : '*Empty*'
                });
        } else
            target.push({
                label: element.getLabel(),
                value: element ? 'True' : 'False'
            });
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     */
    function addElementIfTrue(target, element) {
        if (element)
            target.push({
                label: element.getLabel(),
                value: 'True'
            });
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     */
    function addElementIfFalse(target, element) {
        if (!element)
            target.push({
                label: element.getLabel(),
                value: 'False'
            });
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {string} label
     * @param {string} display
     * @param {string} link
     * @param {string} [code]
     */
    function addLabelAndLinkPair(target, label, display, link, code) {
        target.push({
            label: label,
            value: '[' + escapeForMarkdown(display) + '](' + link + (code ? ') `' + code + '`' : ')')
        });
    }

    var iixExtensionRe = /^(.+?)\.iix$/;

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     */
    function addImageElement(target, element) {
        if (!gs.nil(element)) {
            var attachmentGr = new GlideRecord('sys_attachment');
            if (attachmentGr.get(element.getValue())) {
                var remoteFileName = element.getDisplayValue();
                var fileName = remoteFileName;
                var content_type = attachmentGr.getValue('content_type');
                var m;
                switch (content_type) {
                    case 'image/png':
                        m = fileName.match(iixExtensionRe);
                        if (m)
                            fileName = m[1] + '.jpg';
                        break;
                    case 'image/jpeg':
                        m = fileName.match(iixExtensionRe);
                        if (m)
                            fileName = m[1] + '.png';
                        break;
                    default:
                        fileName = fileName + '; ' + content_type;
                        break;
                }
                target.push({
                    label: element.getLabel(),
                    value: '![' + fileName + '](' + instanceUri + remoteFileName + ')'
                });
            }
        }
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {string} label
     * @param {string} code
     * @param {string} [language]
     * @param {boolean} [force]
     */
    function addLabelAndCode(target, label, code, language, force) {
        if (typeof code !== 'string' || code == '') {
            if (force)
                target.push({
                    label: label,
                    value: '*Empty*'
                });
        } else if (codeBlockReqRe.test(code))
            target.push({
                label: label,
                value: {
                    language: language ? language : 'text',
                    contents: code
                }
            });
        else
            target.push({
                label: label,
                value: '`' + code + '`'
            });
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     * @param {string} [language]
     * @param {boolean} [force]
     */
    function addElementAsCode(target, element, language, force) {
        if (element.nil()) {
            if (force)
                target.push({
                    label: element.getLabel(),
                    value: '*Empty*'
                });
        } else {
            var code = element.getDisplayValue();
            if (codeBlockReqRe.test(code))
                target.push({
                    label: element.getLabel(),
                    value: {
                        language: language ? language : 'text',
                        contents: code
                    }
                });
            else
                target.push({
                    label: element.getLabel(),
                    value: '`' + code + '`'
                });
        }
    }

    /**
     * @param {LabelValuePair[]} target
     * @param {GlideElement} element
     * @param {string} language
     * @param {boolean} [force]
     */
    function addElementAsCodeBlock(target, element, language, force) {
        if (element.nil()) {
            if (force)
                target.push({
                    label: element.getLabel(),
                    value: '*Empty*'
                });
        } else
            target.push({
                label: element.getLabel(),
                value: {
                    language: language ? language : 'text',
                    contents: element.getDisplayValue()
                }
            });
    }

    /**
     * @param {LabelValuePair[]} lvArr
     */
    function labelsAndValuesToString(lvArr) {
        /** @type {number} */
        var i;
        /** @type {LabelValuePair} */
        var lv;
        /** @type {LabelValuePair[]} */
        var forListItems = [];
        /** @type {LabelValuePair[]} */
        var forCodeBlocks = [];
        for (i = 0; i < lvArr.length; i++) {
            lv = lvArr[i];
            if (typeof lv.value == 'string')
                forListItems.push(lv);
            else
                forCodeBlocks.push(lv);
        }
        var result = '';
        if (forListItems.length > 0) {
            result = "\n";
            for (i = 0; i < forListItems.length; i++) {
                lv = forListItems[i];
                result = result + "\n- **" + lv.label + ':** ' + lv.value;
            }
        }
        for (i = 0; i < forCodeBlocks.length; i++) {
            lv = forCodeBlocks[i];
            result = result + "\n\n**" + lv.label + ":**\n\n```" + lv.value.language + "\n" + lv.value.contents + "\n```";
        }
        return result;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    function decodeCatalogConditions(text) {
        var re = /^([^^]+(?:\^(?!NQ)[^^]+)*)\^NQ ?/g;
        var iml = re.test(text);
        if (iml) {
            text = text.replace(re, "\n  - $1^EQ\n  - *OR:* ");
            text = text.replace(/\^NQ ?/g, "^EQ\n  - *OR:* ");
        }
        text = text.replace(/\s?ISNOTEMPTY\^EQ/g, ' is not empty');
        text = text.replace(/\s?ISNOTEMPTY\^\s?/g, ' is not empty **AND** ');
        text = text.replace(/\s?ISEMPTY\^EQ/g, ' is empty');
        text = text.replace(/\s?ISEMPTY\^\s?/g, ' is empty **AND** ');
        text = text.replace(/\s?NOT IN(\w+),(\w+),(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`, `$3`, `$4`');
        text = text.replace(/\s?NOT IN(\w+),(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`, `$3`');
        text = text.replace(/\s?NOT IN(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`');
        text = text.replace(/\s?NOT IN(\w+),(\w+),(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2`, `$3`, `$4` **AND** ');
        text = text.replace(/\s?NOT IN(\w+),(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2`, `$3` **AND** ');
        text = text.replace(/\s?NOT IN(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2` **AND** ');
        text = text.replace(/\s?IN(\w+),(\w+),(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`, `$3`, `$4`');
        text = text.replace(/\s?IN(\w+),(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`, `$3`');
        text = text.replace(/\s?IN(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`');
        text = text.replace(/\s?IN(\w+),(\w+),(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2`, `$3`, `$4` **AND** ');
        text = text.replace(/\s?IN(\w+),(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2`, `$3` **AND** ');
        text = text.replace(/\s?IN(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2` **AND** ');
        text = text.replace(/\s?!=(\w+)\^EQ/g, ' is not `$1`');
        text = text.replace(/\s?!=(\w+)\^\s?/g, ' is not `$1` **AND** ');
        text = text.replace(/\s?=(\w+)\^EQ/g, ' is `$1`');
        text = text.replace(/\s?=(\w+)\^\s?/g, ' is `$1` **AND** ');

        text = text.replace(/\s?!=\^EQ/g, ' is not empty');
        text = text.replace(/\s?!=\^\s?/g, ' is not empty **AND** ');
        text = text.replace(/\s?=\^EQ/g, ' is empty');
        text = text.replace(/\s?=\^\s?/g, ' is empty **AND** ');
        return iml ? text : ' ' + text;
    }

    /**
     * @param {string} cat_item_sys_id
     * @param {MarkdownLinkMap} referenceMap
     * @param {({ [key: string]: OrderedVariableItem })} varsByName
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {OrderedVariableItem[]}
     */
    function getOrderedCatItemVariables(cat_item_sys_id, referenceMap, varsByName, varsBySysId) {
        /** @type {OrderedVariableItem[]} */
        var allVariables = [];
        /** @type {OrderedVariableItem} */
        var item;
        var glideRecord = new GlideRecord('item_option_new');
        glideRecord.addQuery('cat_item', cat_item_sys_id);
        glideRecord.addActiveQuery();
        glideRecord.query();
        while (glideRecord.next()) {
            item = {
                name: {
                    value: glideRecord.getValue('name'),
                    display_text: escapeForMarkdown(glideRecord.getValue(gs.nil(glideRecord.question_text) ? 'name' : 'question_text'))
                },
                sys_id: glideRecord.getValue('sys_id'),
                type: gs.nil(glideRecord.type) ? {
                    value: NaN,
                    display_text: 'NULL'
                } : {
                    value: parseInt(glideRecord.getValue('type')),
                    display_text: escapeForMarkdown(glideRecord.getDisplayValue('type'))
                },
                order: gs.nil(glideRecord.order) ? {
                    value: NaN,
                    display_text: 'NULL'
                } : {
                    value: parseInt(glideRecord.getValue('order')),
                    display_text: glideRecord.getDisplayValue('order')
                },
                properties: []
            };
            allVariables.push(item);
            varsByName[item.name.value] = item;
            varsBySysId[item.sys_id] = item;
        }
        var itemSetGr = new GlideRecord('io_set_item');
        itemSetGr.addQuery('sc_cat_item', cat_item_sys_id);
        itemSetGr.query();
        /** @type {(GlideRecord<"item_option_new_set"> & item_optiitem_option_new_seton_new)} */
        var gr;
        /** @type {(MarkdownLink | undefined)} */
        var link;
        while (itemSetGr.next()) {
            gr = itemSetGr.variable_set.getRefRecord();
            item = {
                name: {
                    value: gr.getValue('internal_name'),
                    display_text: escapeForMarkdown(gr.getValue(gs.nil(gr.title) ? 'internal_name' : 'title'))
                },
                sys_id: gr.getValue('sys_id'),
                is_variable_set: true,
                order: gs.nil(itemSetGr.order) ? {
                    value: NaN,
                    display_text: 'NULL'
                } : {
                    value: parseInt(itemSetGr.getValue('order')),
                    display_text: itemSetGr.getDisplayValue('order')
                },
                properties: []
            };
            link = referenceMap[item.name.value];
            if (typeof link !== 'undefined')
                link.display_text = item.name.display_text;
            allVariables.push(item);
            varsByName[item.name.value] = item;
            varsBySysId[item.sys_id] = item;
        }
        allVariables = allVariables.sort(function(a, b) {
            if (isNaN(a.order.value)) {
                if (!isNaN(b.order.value))
                    return -1;
            } else {
                if (isNaN(b.order.value))
                    return 1;
                var d = a.order.value - b.order.value;
                if (d != 0)
                    return d;
            }
            if (a.name.display_text < b.name.display_text)
                return -1;
            if (a.name.display_text > b.name.display_text)
                return -1;
            if (a.name.value < b.name.value)
                return -1;
            return (a.name.value > b.name.value) ? 1 : 0;
        });
        var containerName = '';
        for (var i = 0; i < allVariables.length; i++) {
            item = allVariables[i];
            if (!item.is_variable_set) {
                switch (item.type.value) {
                    case 19: // Container Start
                        if (item.name.display_text != item.name.value)
                            containerName = item.name.display_text;
                        break;
                    case 24: // Container Split
                        if (containerName != '')
                            item.name.display_text = containerName;
                        break;
                    case 20: // Container End
                        if (containerName != '')
                            item.name.display_text = containerName;
                        containerName = '';
                        break;
                }
            }
        }
        return allVariables;
    }

    /**
     * @param {OrderedVariableSetItem} item
     * @param {MarkdownLinkMap} referenceMap
     * @returns {string}
     */
    function getVariableSetItemMarkdown(item, referenceMap) {
        var glideRecord = new GlideRecord('item_option_new_set');
        glideRecord.get(item.sys_id);
        var link = referenceMap[item.name.value];
        if (typeof link === 'undefined')
            addElementValue(item.properties, glideRecord.title);
        else
            addLabelAndLinkPair(item.properties, "Title", item.name.display_text, link.url);
        if (!isNaN(item.order.value))
            addLabelValuePair(item.properties, "Order", item.order.display_text);
        addElementDisplayValue(item.properties, glideRecord.type, true);
        addElementIfTrue(item.properties, glideRecord.display_title);
        addElementDisplayValue(item.properties, glideRecord.layout);
        addElementValue(item.properties, glideRecord.description);
        return "\n\n### Variable Set: " + item.name.value + labelsAndValuesToString(item.properties);
    }

    /**
     * @param {OrderedQuestionItem} item
     * @param {MarkdownLinkMap} referenceMap
     * @returns {string}
     */
    function getVariableMarkdown(item, referenceMap) {
        var glideRecord = new GlideRecord('item_option_new');
        glideRecord.get(item.sys_id);

        addElementDisplayValue(item.properties, glideRecord.type, true);
        addElementValue(item.properties, glideRecord.question_text);
        addElementValue(item.properties, glideRecord.conversational_label);
        addElementValue(item.properties, glideRecord.tooltip);
        addElementDisplayValue(item.properties, glideRecord.order, true);
        addElementIfTrue(item.properties, glideRecord.show_help);
        if (glideRecord.show_help) {
            if (glideRecord.help_tag != 'More information')
                addElementAsCode(item.properties, glideRecord.help_tag);
            addElementAsCode(item.properties, glideRecord.help_text);
            addElementAsCode(item.properties, glideRecord.instructions, 'html');
        }
        var type = parseInt(glideRecord.type);
        var listChoices = false;
        var refText, refLink;
        switch (type) {
            case 19: // Container Start
                addElementIfTrue(item.properties, glideRecord.display_title);
                addElementDisplayValue(item.properties, glideRecord.layout, true);
                break;
            case 1: // Yes / No
                addElementIfTrue(item.properties, glideRecord.include_none);
                break;
            case 2: // Multi Line Text
                addElementAsCode(item.properties, glideRecord.attributes);
                break;
            case 3: // Multiple Choice
                addElementDisplayValue(item.properties, glideRecord.choice_direction, true);
                addElementIfTrue(item.properties, glideRecord.include_none);
                addElementIfTrue(item.properties, glideRecord.do_not_select_first);
                addElementAsCode(item.properties, glideRecord.attributes);
                listChoices = true;
                break;
            case 5: // Select Box
            case 18: // Lookup Select Box
                if (!gs.nil(glideRecord.choice_table)) {
                    refText = glideRecord.choice_table.getDisplayValue();
                    refLink = referenceMap[refText];
                    if (refLink) {
                        addLabelAndLinkPair(item.properties, glideRecord.choice_table.getLabel(), refLink.display_text, refLink.url, '[' + refText + ']');
                        if (!gs.nil(glideRecord.choice_field)) {
                            refText = glideRecord.getDisplayValue('choice_field');
                            addLabelAndLinkPair(item.properties, glideRecord.choice_field.getLabel(), refText, refLink.url + '#column-' + refText);
                        }
                    } else {
                        addLabelAndCode(item.properties, glideRecord.choice_table.getLabel(), refText);
                        addElementAsCode(item.properties, glideRecord.choice_field);
                    }
                }
                addElementIfTrue(item.properties, glideRecord.include_none);
                addElementIfTrue(item.properties, glideRecord.lookup_unique);
                addElementAsCode(item.properties, glideRecord.attributes);
                listChoices = true;
                break;
            case 22: // Lookup Multiple Choice
                switch (glideRecord.getValue('lookup_source')) {
                    case "choices":
                        addLabelValuePair(item.properties, 'Lookup source', 'Choices');
                        if (!gs.nil(glideRecord.choice_table)) {
                            refText = glideRecord.choice_table.getDisplayValue();
                            refLink = referenceMap[refText];
                            if (refLink) {
                                addLabelAndLinkPair(item.properties, glideRecord.choice_table.getLabel(), refLink.display_text, refLink.url, '[' + refText + ']');
                                if (!gs.nil(glideRecord.choice_field)) {
                                    refText = glideRecord.getDisplayValue('choice_field');
                                    addLabelAndLinkPair(item.properties, glideRecord.choice_field.getLabel(), refText, refLink.url + '#column-' + refText);
                                }
                            } else {
                                addLabelAndCode(item.properties, glideRecord.choice_table.getLabel(), refText);
                                addElementAsCode(item.properties, glideRecord.choice_field);
                            }
                        }
                        break;
                    default:
                        addLabelValuePair(item.properties, 'Lookup source', glideRecord.lookup_source.getDisplayValue() + " (" + glideRecord.lookup_source + ")");
                        break;
                }
                addElementDisplayValue(item.properties, glideRecord.choice_direction, true);
                addElementIfTrue(item.properties, glideRecord.include_none);
                addElementIfTrue(item.properties, glideRecord.lookup_unique);
                addElementValue(item.properties, glideRecord.reference_qual);
                addElementAsCode(item.properties, glideRecord.attributes);
                break;
            case 8: // Reference
                refText = glideRecord.reference.getDisplayValue();
                refLink = referenceMap[refText];
                if (refLink)
                    addLabelAndLinkPair(item.properties, glideRecord.reference.getLabel(), refLink.display_text, refLink.url, '[' + refText + ']');
                else
                    addLabelAndCode(item.properties, glideRecord.reference.getLabel(), refText);
                switch (glideRecord.getValue('use_reference_qualifier')) {
                    case 'simple':
                        addLabelValuePair(item.properties, 'Use reference qualifier', 'Simple');
                        addElementAsCode(item.properties, glideRecord.reference_qual_condition);
                        break;
                    case 'advanced':
                        addLabelValuePair(item.properties, 'Use reference qualifier', 'Advanced');
                        addElementAsCode(item.properties, glideRecord.reference_qual);
                        break;
                    default:
                        addElementValue(item.properties, glideRecord.use_reference_qualifier, true);
                        addElementAsCode(item.properties, glideRecord.reference_qual);
                        break;
                }
                addElementAsCode(item.properties, glideRecord.attributes);
                break;
            case 6: // Single Line Text
            case 7: // Checkbox
            case 9: // Date
            case 10: // Date/Time
            case 20: // Container End
            case 23: // HTML
            case 24: // Container Split
            case 33: // Attachment
            case 32: // Rich Text Label
                break;
            default:
                item.properties.push({
                    label: 'Unknown type',
                    value: "*" + glideRecord.getValue('type') + "*"
                });
                break;
        }
        addElementIfTrue(item.properties, glideRecord.global);
        addElementIfTrue(item.properties, glideRecord.disable_initial_slot_fill);
        addElementDisplayValue(item.properties, glideRecord.variable_width);
        addElementIfFalse(item.properties, glideRecord.visible_standalone);
        addElementIfFalse(item.properties, glideRecord.visible_bundle);
        addElementIfTrue(item.properties, glideRecord.not_available_conversation);
        addElementIfFalse(item.properties, glideRecord.visible_guide);
        addElementIfFalse(item.properties, glideRecord.visible_summary);
        switch (type) {
            case 20: // Container End
            case 24: // Container Split
            case 32: // Rich Text Label
                break;
            case 19: // Container Start
                addElementIfTrue(item.properties, glideRecord.hidden);
                break;
            default:
                addElementIfTrue(item.properties, glideRecord.mandatory);
                if (!glideRecord.mandatory) {
                    addElementIfTrue(item.properties, glideRecord.hidden);
                    addElementIfTrue(item.properties, glideRecord.read_only);
                }
                break;
        }
        switch (type) {
            case 7: // Checkbox
                addLabelAndCode(item.properties, glideRecord.default_value.getLabel(), gs.nil(glideRecord.default_value) ? 'false' : glideRecord.getValue('default_value'));
                break;
            case 23: // HTML
                if (gs.nil(glideRecord.default_html_value))
                    addElementAsCode(item.properties, glideRecord.default_value, 'text', true);
                else
                    addElementAsCode(item.properties, glideRecord.default_html_value, 'html');
                break;
            case 32: // Rich Text Label
                addElementAsCode(item.properties, glideRecord.rich_text, 'html');
                break;
            case 19: // Container Start
            case 20: // Container End
            case 24: // Container Split
                break;
            default:
                addElementAsCode(item.properties, glideRecord.default_value, 'text', true);
                break;
        }

        var text = "\n\n### Variable: " + item.name.value + labelsAndValuesToString(item.properties);

        if (listChoices) {
            var choiceGr = new GlideRecord('question_choice');
            choiceGr.addQuery('question', glideRecord.sys_id);
            choiceGr.addQuery('inactive', false);
            choiceGr.orderBy('order');
            choiceGr.query();
            if (choiceGr.next()) {
                text = text + "\n\n**Choices:**\n\n| Label | Value | Sequence |\n| ----- | ----- | -------- |";
                do {
                    text = text + "\n| " + choiceGr.text + " | " + choiceGr.value + " | " + choiceGr.order + " |";
                } while (choiceGr.next());
            }
        }
        return text;
    }

    var emptyFuncRe = /^[\r\n\s]*function\s+onCondition\s*\(\s*\)[\r\n\s]*\{[\r\n\s]*\}[\r\n\s]*$/g;
    var idRe = /IO:([a-f\d]{32})/g;

    /**
     * @param {(GlideRecord<"catalog_ui_policy"> & catalog_ui_policy)} glideRecord
     * @param {({ [key: string]: OrderedVariableItem })} varsByName
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getUiPolicyMarkdown(glideRecord, varsByName, varsBySysId) {
        /** @type {(OrderedVariableItem | undefined)} */
        var item;
        var text = "\n\n### UI Policy: " + glideRecord.getValue('short_description').trim() + "\n";
        if (!gs.nil(glideRecord.catalog_conditions)) {
            var catalog_conditions = glideRecord.getValue('catalog_conditions');
            var replaced = '';
            var startIndex = 0;
            while ((match = idRe.exec(catalog_conditions)) !== null) {
                item = varsBySysId[match[1]];
                if (item) {
                    if (match.index > startIndex)
                        replaced = replaced + catalog_conditions.substring(startIndex, match.index);
                    replaced = replaced + ' [' + item.name.display_text + (item.is_variable_set ? '](#variable-set-' : '](#variable-') + item.name.value + ') ';
                    startIndex = match.index + match[0].length;
                }
            }
            if (startIndex > 0)
                catalog_conditions = ((startIndex < catalog_conditions.length) ? replaced + catalog_conditions.substring(startIndex) : replaced).trim();
            text = text + "\n- **Catalog conditions:**" + decodeCatalogConditions(catalog_conditions.trim());
        }
        text = text + "\n- **Order:** " + glideRecord.order;
        if (glideRecord.applies_catalog)
            text = text + "\n- **Applies on Catalog Item view:** True";
        if (glideRecord.applies_sc_task)
            text = text + "\n- **Applies on Catalog Tasks:** True";
        if (glideRecord.applies_req_item)
            text = text + "\n- **Applies on Requested Items:** True";
        if (glideRecord.on_load)
            text = text + "\n- **On load:** True";
        if (glideRecord.reverse_if_false)
            text = text + "\n- **Reverse if false:** True";
        if (glideRecord.run_scripts) {
            text = text + "\n- **Run scripts:** True";
            var ui_type = glideRecord.getDisplayValue('ui_type');
            if (ui_type != '')
                text = text + "\n- **Run scripts in UI type:** " + escapeForMarkdown(ui_type);
        }

        var gr = new GlideRecord('catalog_ui_policy_action');
        gr.addQuery('ui_policy', glideRecord.sys_id);
        gr.orderBy('order');
        gr.query();
        if (gr.next()) {
            text = text + "\n\n**Catalog UI Policy Actions:**\n\n| Name | Mandatory   | Visible     | Read only   | Order | Value action |\n| ---- | ----------- | ----------- | ----------- | ----- | ------------ |";
            do {
                var vn = gr.getValue('variable');
                item = varsByName[vn];
                text = text + "\n| [" + ((typeof item === 'undefined') ? vn : item.name.display_text) + ((typeof item !== 'undefined' && item.is_variable_set) ? "](#variable-set-" : "](#variable-") + vn + ") | ";
                switch (gr.getValue('mandatory')) {
                    case 'true':
                        text = text + "True        | ";
                        break;
                    case 'false':
                        text = text + "False       | ";
                        break;
                    default:
                        text = text + "Leave alone | ";
                        break;
                }
                switch (gr.getValue('visible')) {
                    case 'true':
                        text = text + "True        | ";
                        break;
                    case 'false':
                        text = text + "False       | ";
                        break;
                    default:
                        text = text + "Leave alone | ";
                        break;
                }
                switch (gr.getValue('disabled')) {
                    case 'true':
                        text = text + "True        | ";
                        break;
                    case 'false':
                        text = text + "False       | ";
                        break;
                    default:
                        text = text + "Leave alone | ";
                        break;
                }
                text = text + gr.order + ' | ';
                if (gr.cleared)
                    text = text + "Clear value |";
                else
                    switch (gr.getValue('value_action')) {
                        case 'clear_value':
                            text = text + "Clear value |";
                            break;
                        case 'ignore':
                            text = text + "Leave alone |";
                            break;
                        case 'set_value':
                            text = text + "Set value: `" + gr.value + "` |";
                            break;
                        default:
                            text = text + gr.value_action + " |";
                            break;
                    }
            } while (gr.next());
        }
        if (glideRecord.run_scripts) {
            var s;
            if (!gs.nil(glideRecord.script_true)) {
                s = glideRecord.getValue('script_true');
                if (!emptyFuncRe.test(s))
                    text = text + "\n\n**Execute if true:**\n\n```javascript\n" + s.trim() + "\n```";
            }
            if (!gs.nil(glideRecord.script_false)) {
                s = glideRecord.getValue('script_false');
                if (!emptyFuncRe.test(s))
                    text = text + "\n\n**Execute if false:**\n\n```javascript\n" + s.trim() + "\n```";
            }
        }
        return text;
    }

    /**
     * @param {string} cat_item_sys_id
     * @param {({ [key: string]: OrderedVariableItem })} varsByName
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getCatalogUiPoliciesMarkdown(cat_item_sys_id, varsByName, varsBySysId) {
        var glideRecord = new GlideRecord('catalog_ui_policy');
        glideRecord.addQuery('catalog_item', cat_item_sys_id);
        glideRecord.orderBy('order');
        glideRecord.orderBy('short_description');
        glideRecord.query();
        if (!glideRecord.next())
            return '';

        var text = "\n\n## Catalog UI Policies";

        do {
            text = text + getUiPolicyMarkdown(glideRecord, varsByName, varsBySysId);
        } while (glideRecord.next());

        return text;
    }

    /**
     * @param {string} var_set_sys_id
     * @param {({ [key: string]: OrderedVariableItem })} varsByName
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getVarSetUiPoliciesMarkdown(var_set_sys_id, varsByName, varsBySysId) {
        var glideRecord = new GlideRecord('catalog_ui_policy');
        glideRecord.addQuery('variable_set', var_set_sys_id);
        glideRecord.orderBy('order');
        glideRecord.orderBy('short_description');
        glideRecord.query();
        if (!glideRecord.next())
            return '';

        var text = "\n\n## Catalog UI Policies";

        do {
            text = text + getUiPolicyMarkdown(glideRecord, varsByName, varsBySysId);
        } while (glideRecord.next());

        return text;
    }

    /**
     * @param {(GlideRecord<"catalog_script_client"> & catalog_script_client)} glideRecord
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getClientScriptMarkdown(glideRecord, varsBySysId) {
        var typeName = glideRecord.getValue('type');
        var text = "\n\n### Client Script: " + glideRecord.getValue('name') + "\n\n- **Type:** " + typeName;
        if (typeName == 'onChange' && !gs.nil(glideRecord.cat_variable)) {
            var cat_variable = glideRecord.getValue('cat_variable');
            if (cat_variable.startsWith('IO:')) {
                cat_variable = cat_variable.substring(3);
                /** @type {(OrderedVariableItem | undefined)} */
                var item = varsBySysId[cat_variable];
                if (item)
                    cat_variable = '[' + item.name.display_text + (item.is_variable_set ? '](#variable-set-' : '](#variable-') + item.name.value + ')';
                else
                    cat_variable = '`' + cat_variable + '`';
            }
            text = text + "\n- **Variable name:** " + cat_variable;
        }
        if (!gs.nil(glideRecord.order) && glideRecord.order != 0)
            text = text + "\n- **Order:** " + glideRecord.getDisplayValue('order');
        if (glideRecord.applies_catalog)
            text = text + "\n- **Applies on Catalog Item view:** True";
        if (glideRecord.applies_sc_task)
            text = text + "\n- **Applies on Catalog Tasks:** True";
        if (glideRecord.applies_req_item)
            text = text + "\n- **Applies on Requested Items:** True";

        return text;
    }

    /**
     * @param {string} cat_item_sys_id
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getCatalogClientScriptsMarkdown(cat_item_sys_id, varsBySysId) {
        var glideRecord = new GlideRecord('catalog_script_client');
        glideRecord.addQuery('cat_item', cat_item_sys_id);
        glideRecord.addActiveQuery();
        glideRecord.orderBy('name');
        glideRecord.query();

        if (!glideRecord.next())
            return '';

        var text = "\n\n## Catalog Client Scripts";
        do {
            text = text + getClientScriptMarkdown(glideRecord, varsBySysId);
        } while (glideRecord.next());

        return text;
    }

    /**
     * @param {string} var_set_sys_id
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {string}
     */
    function getVarSetClientScriptsMarkdown(var_set_sys_id, varsBySysId) {
        var glideRecord = new GlideRecord('catalog_script_client');
        glideRecord.addQuery('variable_set', var_set_sys_id);
        glideRecord.addActiveQuery();
        glideRecord.orderBy('name');
        glideRecord.query();

        if (!glideRecord.next())
            return '';

        var text = "\n\n## Catalog Client Scripts";
        do {
            text = text + getClientScriptMarkdown(glideRecord, varsBySysId);
        } while (glideRecord.next());

        return text;
    }

    function ensureReferenceMap(referenceMap) {
        var markdown_reference_map = gs.getProperty('x_1645769_lte_dhlp.markdown_reference_map');
        if (markdown_reference_map) {
            var defaultMap;
            try {
                defaultMap = JSON.parse(markdown_reference_map);
                if (typeof referenceMap === 'object' && referenceMap !== null)
                    return referenceMap;
            } catch (e) {
                defaultMap = undefined;
            }
            if (typeof defaultMap === 'object' && defaultMap !== null) {
                if (typeof referenceMap === 'object' && referenceMap !== null) {
                    for (var n in referenceMap)
                        defaultMap[n] = referenceMap[n];
                }
                return defaultMap;
            }
        }

        return (typeof referenceMap === 'object' && referenceMap !== null) ? referenceMap : {};
    }

    /**
     * @param {(GlideRecord<"sc_cat_item"> & sc_cat_item)} glideRecord
     * @param {MarkdownLinkMap} referenceMap
     * @returns {string}
     */
    function getCatalogItemMarkdown(glideRecord, referenceMap) {
        /** @type {LabelValuePair[]} */
        var labelsAndValues = [];
        addElementDisplayValue(labelsAndValues, glideRecord.short_description);
        addElementAsCodeBlock(labelsAndValues, glideRecord.description, 'html');
        addElementDisplayValue(labelsAndValues, glideRecord.sc_catalogs);
        addElementDisplayValue(labelsAndValues, glideRecord.category);
        if (glideRecord.fulfillment_automation_level != 'unspecified')
            addElementDisplayValue(labelsAndValues, glideRecord.fulfillment_automation_level);
        addElementDisplayValue(labelsAndValues, glideRecord.group);
        if (!gs.nil(glideRecord.order) && glideRecord.order != 0)
            addElementDisplayValue(labelsAndValues, glideRecord.order);
        addElementDisplayValue(labelsAndValues, glideRecord.meta);
        addElementDisplayValue(labelsAndValues, glideRecord.flow_designer_flow);
        addElementDisplayValue(labelsAndValues, glideRecord.workflow);
        addElementDisplayValue(labelsAndValues, glideRecord.delivery_plan);
        addElementDisplayValue(labelsAndValues, glideRecord.request_method, true);
        addElementIfTrue(labelsAndValues, glideRecord.no_cart_v2);
        addElementIfTrue(labelsAndValues, glideRecord.no_quantity_v2);
        addElementIfTrue(labelsAndValues, glideRecord.no_delivery_time_v2);
        addElementIfTrue(labelsAndValues, glideRecord.no_save_as_draft);
        addElementIfTrue(labelsAndValues, glideRecord.no_attachment_v2);
        addElementIfTrue(labelsAndValues, glideRecord.mandatory_attachment);
        var cat_item_sys_id = glideRecord.getValue('sys_id');
        addLabelAndLinkPair(labelsAndValues, 'Links', 'Dev', instanceUri + "nav_to.do?uri=sc_cat_item.do?sys_id=" + cat_item_sys_id);
        addImageElement(labelsAndValues, glideRecord.icon);
        addImageElement(labelsAndValues, glideRecord.picture);

        var text = "# \"" + escapeForMarkdown(glideRecord.name) + "\" Catalog Item" + labelsAndValuesToString(labelsAndValues) +
            "\n\n_______________________________________________";

        /** @type {({ [key: string]: OrderedVariableItem })} */
        var varsByName = {};
        /** @type {({ [key: string]: OrderedVariableItem })} */
        var varsBySysId = {};
        /** @type {OrderedVariableItem[]} */
        var allVariables = getOrderedCatItemVariables(cat_item_sys_id, referenceMap, varsByName, varsBySysId);
        // return JSON.stringify(allVariables);
        if (allVariables.length > 0) {
            text = text + "\n\n## Variables\n\n| Type | Question | Order |\n| -------- | ----- |";
            var i;
            for (i = 0; i < allVariables.length; i++) {
                item = allVariables[i];
                if (item.is_variable_set)
                    text = text + "\n| Variable Set | [" + item.name.display_text + '](#variable-set-' + item.name.value + ') | ' + item.order.display_text + ' |';
                else
                    switch (item.type.value) {
                        case 19: // Container Start
                        case 20: // Container End
                        case 24: // Container Split
                            text = text + "\n| *\\(" + item.type.display_text + '\\)* | *[' + item.name.display_text + '](#variable-' + item.name.value + ')* | ' + item.order.display_text + ' |';
                            break;
                        default:
                            text = text + "\n| " + item.type.display_text + ' | [' + item.name.display_text + '](#variable-' + item.name.value + ') | ' + item.order.display_text + ' |';
                            break;
                    }
            }
            for (i = 0; i < allVariables.length; i++) {
                item = allVariables[i];
                if (item.is_variable_set)
                    text = text + getVariableSetItemMarkdown(item, referenceMap);
                else
                    text = text + getVariableMarkdown(item, referenceMap);
            }
        }

        return text + getCatalogUiPoliciesMarkdown(cat_item_sys_id, varsByName, varsBySysId) + getCatalogClientScriptsMarkdown(cat_item_sys_id, varsBySysId);
    }

    /**
     * @param {string} var_set_sys_id
     * @param {({ [key: string]: OrderedVariableItem })} varsByName
     * @param {({ [key: string]: OrderedVariableItem })} varsBySysId
     * @returns {OrderedQuestionItem[]}
     */
    function getOrderedVariableSetVariables(var_set_sys_id, varsByName, varsBySysId) {
        /** @type {OrderedQuestionItem[]} */
        var allVariables = [];
        /** @type {OrderedQuestionItem} */
        var item;
        var glideRecord = new GlideRecord('item_option_new');
        glideRecord.addQuery('variable_set', var_set_sys_id);
        glideRecord.addActiveQuery();
        glideRecord.query();
        while (glideRecord.next()) {
            item = {
                name: {
                    value: glideRecord.getValue('name'),
                    display_text: escapeForMarkdown(glideRecord.getValue(gs.nil(glideRecord.question_text) ? 'name' : 'question_text'))
                },
                sys_id: glideRecord.getValue('sys_id'),
                type: gs.nil(glideRecord.type) ? {
                    value: NaN,
                    display_text: 'NULL'
                } : {
                    value: parseInt(glideRecord.getValue('type')),
                    display_text: escapeForMarkdown(glideRecord.getDisplayValue('type'))
                },
                order: gs.nil(glideRecord.order) ? {
                    value: NaN,
                    display_text: 'NULL'
                } : {
                    value: parseInt(glideRecord.getValue('order')),
                    display_text: glideRecord.getDisplayValue('order')
                },
                properties: []
            };
            allVariables.push(item);
            varsByName[item.name.value] = item;
            varsBySysId[item.sys_id] = item;
        }
        allVariables = allVariables.sort(function(a, b) {
            if (isNaN(a.order.value)) {
                if (!isNaN(b.order.value))
                    return -1;
            } else {
                if (isNaN(b.order.value))
                    return 1;
                var d = a.order.value - b.order.value;
                if (d != 0)
                    return d;
            }
            if (a.name.display_text < b.name.display_text)
                return -1;
            if (a.name.display_text > b.name.display_text)
                return -1;
            if (a.name.value < b.name.value)
                return -1;
            return (a.name.value > b.name.value) ? 1 : 0;
        });
        var containerName = '';
        for (var i = 0; i < allVariables.length; i++) {
            item = allVariables[i];
            if (!item.is_variable_set) {
                switch (item.type.value) {
                    case 19: // Container Start
                        if (item.name.display_text != item.name.value)
                            containerName = item.name.display_text;
                        break;
                    case 24: // Container Split
                        if (containerName != '')
                            item.name.display_text = containerName;
                        break;
                    case 20: // Container End
                        if (containerName != '')
                            item.name.display_text = containerName;
                        containerName = '';
                        break;
                }
            }
        }
        return allVariables;
    }

    /**
     * @param {(GlideRecord<"item_option_new_set"> & item_option_new_set)} glideRecord
     * @param {MarkdownLinkMap} referenceMap
     * @returns {string}
     */
    function getVariableSetMarkdown(glideRecord, referenceMap) {
        /** @type {LabelValuePair[]} */
        var labelsAndValues = [];
        addElementAsCode(labelsAndValues, glideRecord.internal_name);
        addElementDisplayValue(labelsAndValues, glideRecord.order);
        addElementDisplayValue(labelsAndValues, glideRecord.type);
        addElementIfTrue(labelsAndValues, glideRecord.display_title);
        addElementDisplayValue(labelsAndValues, glideRecord.layout);
        addElementDisplayValue(labelsAndValues, glideRecord.description);
        var var_set_sys_id = glideRecord.getValue('sys_id');
        addLabelAndLinkPair(labelsAndValues, 'Links', 'Dev', instanceUri + "nav_to.do?uri=item_option_new_set.do?sys_id=" + var_set_sys_id);

        /** @type {({ [key: string]: OrderedVariableItem })} */
        var varsByName = {};
        /** @type {({ [key: string]: OrderedVariableItem })} */
        var varsBySysId = {};
        /** @type {OrderedVariableItem[]} */
        var allVariables = getOrderedVariableSetVariables(var_set_sys_id, varsByName, varsBySysId);

        var text = "# \"" + escapeForMarkdown(glideRecord.getValue((gs.nil(glideRecord.title) ? 'internal_name' : 'title'))) + "\" Variable Set" +
            labelsAndValuesToString(labelsAndValues) + "\n\n_______________________________________________";
        if (allVariables.length > 0) {
            text = text + "\n\n## Variables\n\n| Type | Question | Order |\n| -------- | ----- |";
            var i;
            for (i = 0; i < allVariables.length; i++) {
                item = allVariables[i];
                if (item.is_variable_set)
                    text = text + "\n| Variable Set | [" + item.name.display_text + '](#variable-set-' + item.name.value + ') | ' + item.order.display_text + ' |';
                else
                    switch (item.type.value) {
                        case 19: // Container Start
                        case 20: // Container End
                        case 24: // Container Split
                            text = text + "\n| *\\(" + item.type.display_text + '\\)* | *[' + item.name.display_text + '](#variable-' + item.name.value + ')* | ' + item.order.display_text + ' |';
                            break;
                        default:
                            text = text + "\n| " + item.type.display_text + ' | [' + item.name.display_text + '](#variable-' + item.name.value + ') | ' + item.order.display_text + ' |';
                            break;
                    }
            }
            for (i = 0; i < allVariables.length; i++)
                text = text + getVariableMarkdown(allVariables[i], referenceMap);
        }

        return text + getVarSetUiPoliciesMarkdown(var_set_sys_id, varsByName, varsBySysId) + getVarSetClientScriptsMarkdown(var_set_sys_id, varsBySysId);
    }

    /** @type {LTEDevHelperConstructor} */
    var LTEDevHelperConstructor = Class.create();
    LTEDevHelperConstructor.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
        getCatalogItemMarkdown: function() {
            var target = this.getParameter('sysparm_sys_id');
            if (!target)
                return "Value for sys_id parameter not provided.";
            var gr;
            try {
                gr = new GlideRecord('sc_cat_item');
                if (!gr.get(target))
                    return "Catalog item with sys_id " + JSON.stringify(target) + " not found.";
            } catch (e) {
                return "Error loading catalog item with sys_id " + JSON.stringify(target) + ": " + (e.stack ? e + "\nStack:\n" + e.stack : e);
            }
            var ref_map = this.getParameter('sysparm_ref_map');
            var referenceMap;
            if (ref_map) {
                try {
                    referenceMap = JSON.parse(ref_map);
                } catch (e) {
                    return "Error parsing sysparm_ref_map: " + (e.stack ? e + "\nStack:\n" + e.stack : e);
                }
            } else
                referenceMap = undefined;
            try {
                return getCatalogItemMarkdown(gr, ensureReferenceMap(referenceMap));
            } catch (e) {
                return "Error generating markdown: " + (e.stack ? e + "\nStack:\n" + e.stack : e);
            }
        },

        getVariableSetMarkdown: function() {
            var target = this.getParameter('sysparm_sys_id');
            if (!target)
                return "Value for sys_id parameter not provided.";
            var gr;
            try {
                gr = new GlideRecord('item_option_new_set');
                if (!gr.get(target))
                    return "Variable set with sys_id " + JSON.stringify(target) + " not found.";
            } catch (e) {
                return "Error loading variable set with sys_id " + JSON.stringify(target) + ": " + e;
            }
            var ref_map = this.getParameter('sysparm_ref_map');
            var referenceMap;
            if (ref_map) {
                try {
                    referenceMap = JSON.parse(ref_map);
                } catch (e) {
                    return "Error parsing sysparm_ref_map: " + e;
                }
            } else
                referenceMap = undefined;
            return getVariableSetMarkdown(gr, ensureReferenceMap(referenceMap));
        },

        type: 'LTEDevHelper'
    });

    LTEDevHelperConstructor.escapeForMarkdown = escapeForMarkdown;
    LTEDevHelperConstructor.tokenizeQueryString = tokenizeQueryString;

    /**
     * @param {((GlideRecord<"sc_cat_item"> & sc_cat_item) | string)} target
     * @param {MarkdownLinkMap} [referenceMap]
     * @returns {string}
     */
    LTEDevHelperConstructor.getCatalogItemMarkdown = function(target, referenceMap) {
        if (typeof target === 'string') {
            var gr = new GlideRecord('sc_cat_item');
            if (gr.get(target))
                return getCatalogItemMarkdown(gr, ensureReferenceMap(referenceMap));
        } else if (target.isValidRecord && target.isValidRecord())
            return getCatalogItemMarkdown(target, ensureReferenceMap(referenceMap));
        throw new Error("Invalid catalog item record or catalog item not found");
    };

    /**
     * @param {((GlideRecord<"item_option_new_set"> & item_option_new_set) | string)} target
     * @param {MarkdownLinkMap} [referenceMap]
     * @returns {string}
     */
    LTEDevHelperConstructor.getVariableSetMarkdown = function(target, referenceMap) {
        if (typeof target === 'string') {
            var gr = new GlideRecord('item_option_new_set');
            if (gr.get(target))
                return getVariableSetMarkdown(gr, ensureReferenceMap(referenceMap));
        } else if (target.isValidRecord && target.isValidRecord())
            return getVariableSetMarkdown(target, ensureReferenceMap(referenceMap));
        throw new Error("Invalid variable set record or variable set not found");
    };
    return LTEDevHelperConstructor;
})();