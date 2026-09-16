var VariableMap = (function() {
    var VariableMapConstructor = Class.create();

    var idRe = /IO:([a-f\d]{32})/g;
    var encodedRe = /^([^^]+(?:\^(?!NQ)[^^]+)*)\^NQ ?/g;

    VariableMapConstructor.prototype = {
        _parent_sys_id: '',

        getParentSysID: function() {
            return this._parent_sys_id;
        },

        _parent_display_value: '',

        getParentDisplayValue: function() {
            return this._parent_display_value;
        },

        _parent_table_name: '',

        getParentTableName: function() {
            return this._parent_table_name;
        },

        _parent_class_name: '',

        getParentClassName: function() {
            return this._parent_class_name;
        },

        _parent_is_variable_set: false,

        parentIsVariableSet: function() {
            return this._parent_is_variable_set;
        },

        _parent_is_record_producer: false,

        parentIsRecordProducer: function() {
            return this._parent_is_record_producer;
        },

        _allVariables: [],

        _variableSets: [],

        getAllVariables: function() {
            return this._allVariables;
        },

        _bySysId: {},

        findVariableBySysId: function(sys_id) {
            var result = this._bySysId[sys_id];
            if (typeof result != 'undefined')
                return {
                    variable: result
                };
            if (!this._parent_is_variable_set)
                for (var i = 0; i < this._variableSets.length; i++) {
                    var var_set = this._variableSets[i];
                    result = var_set.getVariableBySysId(sys_id);
                    if (typeof result != 'undefined')
                        return {
                            variable: result,
                            variable_set: var_set
                        };
                }
        },

        getVariableBySysId: function(sys_id) {
            return this._bySysId[sys_id];
        },

        getNestedVariableBySysId: function(sys_id) {
            if (!this._parent_is_variable_set)
                for (var i = 0; i < this._variableSets.length; i++) {
                    result = this._variableSets[i].getVariableBySysId(sys_id);
                    if (typeof result != 'undefined')
                        return result;
                }
        },

        _byName: {},

        findVariableByName: function(varName) {
            var result = this._byName[varName];
            if (typeof result != 'undefined')
                return {
                    variable: result
                };
            if (!this._parent_is_variable_set)
                for (var i = 0; i < this._variableSets.length; i++) {
                    var var_set = this._variableSets[i];
                    result = var_set.getVariableByName(varName);
                    if (typeof result != 'undefined')
                        return {
                            variable: result,
                            variable_set: var_set
                        };
                }
        },

        getVariableByName: function(varName) {
            return this._byName[varName];
        },

        getNestedVariableByName: function(varName) {
            var result = this._byName[varName];
            if (!this._parent_is_variable_set)
                for (var i = 0; i < this._variableSets.length; i++) {
                    result = this._variableSets[i].getVariableByName(varName);
                    if (typeof result != 'undefined')
                        return result;
                }
        },

        /**
         * @param {MarkdownGenerationContext} context
         * @param {UIPolicyInfo[]} uiPolicies
         * @param {ClientScriptInfo[]} clientScripts
         * @param {string[]} markdownLines
         */
        pushVariablesSectionMarkdown: function(context, uiPolicies, clientScripts, markdownLines) {
            if (this._allVariables.length < 1)
                return;

            var i;
            /** @type {QuestionItem} */
            var item;
            var type, linkTxt, question_text;
            if (this._parent_is_record_producer) {
                markdownLines.push(
                    '',
                    '## Variables',
                    '',
                    '| Type | Question | Name | Field | Order |',
                    '| ---- | -------- | ---- | ----- | ----- |'
                );
                for (i = 0; i < this._allVariables.length; i++) {
                    item = this._allVariables[i];
                    type = item.type_label;
                    question_text = item.question_text ? item.question_text : item.name;
                    if (item.set_map)
                        linkTxt = '[' + question_text + '](#variable-set-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                    else
                        switch (item.type_value) {
                            case 19: // Container Start
                                linkTxt = '*[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')*';
                                type = '*\\(' + type + '\\)*';
                                break;
                            case 24: // Container Split
                            case 20: // Container End
                                linkTxt = '*[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(item.name) + ')*';
                                type = '*\\(' + type + '\\)*';
                                break;
                            default:
                                linkTxt = '[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                                break;
                        }
                    markdownLines.push('| ' + type + ' | ' + linkTxt + ' | `' + item.name + '` | ' + (item.field ? item.field.display_value + ' | ' : '| ') + item.order.display_value + ' |');
                }
            } else {
                markdownLines.push(
                    '',
                    '## Variables',
                    '',
                    '| Type | Question | Name | Order |',
                    '| ---- | -------- | ---- | ----- |'
                );
                for (i = 0; i < this._allVariables.length; i++) {
                    item = this._allVariables[i];
                    type = item.type_label;
                    question_text = item.question_text ? item.question_text : item.name;
                    if (item.set_map)
                        linkTxt = '[' + question_text + '](#variable-set-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                    else
                        switch (item.type_value) {
                            case 19: // Container Start
                                linkTxt = '*[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')*';
                                type = '*\\(' + type + '\\)*';
                                break;
                            case 24: // Container Split
                            case 20: // Container End
                                linkTxt = '*[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(item.name) + ')*';
                                type = '*\\(' + type + '\\)*';
                                break;
                            default:
                                linkTxt = '[' + question_text + '](#variable-' + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                                break;
                        }
                    markdownLines.push('| ' + type + ' | ' + linkTxt + ' | `' + item.name + '` | ' + item.order.display_value + ' |');
                }
            }
            for (i = 0; i < this._allVariables.length; i++) {
                item = this._allVariables[i];
                /** @type {LabeledMultilineStackItem[]} */
                var multiLineStack = [];
                if (item.set_map) {
                    varSetGr = new GlideRecord('item_option_new_set');
                    varSetGr.get(item.sys_id);
                    markdownLines.push('');
                    markdownLines.push("### Variable Set: " + varSetGr.getValue(gs.nil(varSetGr.title) ? 'internal_name' : 'title'));
                    markdownLines.push('');
                    markdownLines.push('- **Internal name:** [' + MarkdownGenerationContext.minimalEscapeForMarkdown(varSetGr.getValue('internal_name')) + '](' + context.mapper.getVarSetUrl(varSetGr, context.getCurrentFolder()) + ')');
                    markdownLines.push('- **Order:** ' + item.order.display_value);
                    context.pushDisplayValueListItem(varSetGr.type, markdownLines, multiLineStack);
                    context.pushListItemIfTrue(varSetGr.display_title, markdownLines);
                    context.pushDisplayValueListItem(varSetGr.layout, markdownLines, multiLineStack);
                    context.pushCodeBlockListItem(varSetGr.description, 'html', multiLineStack);
                    context.pushMultiLineItems(multiLineStack, markdownLines);
                } else {
                    variableGr = new GlideRecord('item_option_new');
                    variableGr.get(item.sys_id);
                    question_text = variableGr.getValue(gs.nil(variableGr.question_text) ? 'name' : 'question_text');
                    markdownLines.push('');
                    markdownLines.push("### Variable: " + MarkdownGenerationContext.escapeForMarkdown(question_text));
                    markdownLines.push('');

                    if (variableGr.getDisplayValue('map_to_field') == 'true') {
                        markdownLines.push('- **' + MarkdownGenerationContext.escapeForMarkdown(variableGr.map_to_field.getLabel()) + ':** True');
                        markdownLines.push('- **' + MarkdownGenerationContext.escapeForMarkdown(variableGr.field.getLabel()) + ':** ' + context.getColumnReferenceMdLink(variableGr.record_producer_table, variableGr.field));
                    }
                    context.pushDisplayValueListItem(variableGr.type, markdownLines, multiLineStack);
                    context.pushValueListItem(variableGr.name, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(variableGr.conversational_label, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(variableGr.tooltip, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(variableGr.order, markdownLines, multiLineStack);
                    context.pushListItemIfTrue(variableGr.show_help, markdownLines);
                    if (variableGr.getDisplayValue('show_help') == 'true') {
                        if (variableGr.help_tag != 'More information')
                            context.pushValueListItem(variableGr.help_tag, markdownLines, multiLineStack);
                        context.pushDisplayValueListItem(variableGr.help_text, markdownLines, multiLineStack);
                        context.pushCodeBlockListItem(variableGr.instructions, 'html', multiLineStack);
                    }
                    var listChoices = false;
                    type = parseInt(variableGr.getValue('type'));
                    switch (type) {
                        case 1: // Yes / No
                            context.pushListItemIfTrue(variableGr.include_none, markdownLines);
                            break;
                        case 2: // Multi Line Text
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            break;
                        case 3: // Multiple Choice
                            context.pushDisplayValueListItem(variableGr.choice_direction, markdownLines, multiLineStack);
                            context.pushListItemIfTrue(variableGr.include_none, markdownLines);
                            context.pushListItemIfTrue(variableGr.do_not_select_first, markdownLines);
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            listChoices = true;
                            break;
                        case 5: // Select Box
                        case 18: // Lookup Select Box
                            if (!gs.nil(variableGr.choice_table)) {
                                context.pushTableReferenceListItem(variableGr.choice_table, markdownLines);
                                context.pushFieldReferenceListItem(variableGr.choice_table, variableGr.choice_field, markdownLines);
                            }
                            context.pushListItemIfTrue(variableGr.include_none, markdownLines);
                            context.pushListItemIfTrue(variableGr.lookup_unique, markdownLines);
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            listChoices = true;
                            break;
                        case 8: // Reference
                            context.pushTableReferenceListItem(variableGr.reference, markdownLines);
                            context.pushDisplayValueListItem(variableGr.use_reference_qualifier, markdownLines, multiLineStack);
                            switch (variableGr.getValue('use_reference_qualifier')) {
                                case 'simple':
                                    if (!gs.nil(variableGr.reference_qual_condition))
                                        markdownLines.push('- **' + MarkdownGenerationContext.escapeForMarkdown(variableGr.reference_qual_condition.getLabel()) + ':** ' + this.decodeConditionString(variableGr.getValue('reference_qual_condition'), context));
                                    // context.pushCodeListItem(variableGr.reference_qual_condition, 'text', markdownLines, multiLineStack);
                                    break;
                                default:
                                    context.pushCodeListItem(variableGr.reference_qual, 'javascript', markdownLines, multiLineStack);
                                    break;
                            }
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            break;
                        case 19: // Container Start
                            context.pushListItemIfTrue(variableGr.display_title, markdownLines);
                            context.pushDisplayValueListItem(variableGr.layout, markdownLines, multiLineStack);
                            break;
                        case 22: // Lookup Multiple Choice
                            context.pushDisplayValueListItem(variableGr.lookup_source, markdownLines, multiLineStack);
                            switch (variableGr.getValue('lookup_source')) {
                                case 'choice':
                                case 'choices':
                                    if (!gs.nil(variableGr.choice_table)) {
                                        context.pushTableReferenceListItem(variableGr.choice_table, markdownLines);
                                        context.pushFieldReferenceListItem(variableGr.choice_table, variableGr.choice_field, markdownLines);
                                    }
                                    break;
                            }
                            context.pushDisplayValueListItem(variableGr.choice_direction, markdownLines, multiLineStack);
                            context.pushListItemIfTrue(variableGr.include_none, markdownLines);
                            context.pushListItemIfTrue(variableGr.lookup_unique, markdownLines);
                            if (!gs.nil(variableGr.reference_qual))
                                markdownLines.push('- **' + MarkdownGenerationContext.escapeForMarkdown(variableGr.reference_qual.getLabel()) + ':** ' + this.decodeConditionString(variableGr.getValue('reference_qual'), context));
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            break;
                        case 21: // List Collector
                            context.pushTableReferenceListItem(variableGr.list_table, markdownLines);
                            context.pushDisplayValueListItem(variableGr.use_reference_qualifier, markdownLines, multiLineStack);
                            switch (variableGr.getValue('use_reference_qualifier')) {
                                case 'simple':
                                    if (!gs.nil(variableGr.reference_qual_condition))
                                        markdownLines.push('- **' + MarkdownGenerationContext.escapeForMarkdown(variableGr.reference_qual_condition.getLabel()) + ':** ' + this.decodeConditionString(variableGr.getValue('reference_qual_condition'), context));
                                    break;
                                default:
                                    context.pushCodeListItem(variableGr.reference_qual, 'javascript', markdownLines, multiLineStack);
                                    break;
                            }
                            context.pushCodeListItem(variableGr.attributes, 'text', markdownLines, multiLineStack);
                            break;
                        case 4: // Numeric Scale
                        case 6: // Single Line Text
                        case 7: // CheckBox
                        case 9: // Date
                        case 10: // Date/Time
                        case 11: // Label
                        case 12: // Break
                        case 14: // Custom
                        case 15: // UI Page
                        case 16: // Wide Single Line Text
                        case 17: // Custom with Label
                        case 20: // Container End
                        case 23: // HTML
                        case 24: // Container Split
                        case 25: // Masked
                        case 26: // Email
                        case 27: // URL
                        case 28: // IP Address
                        case 29: // Duration
                        case 31: // Requested For
                        case 32: // Rich Text Label
                        case 33: // Attachment
                        case 40: // Table Name
                            break;
                        default:
                            markdownLines.push("- **Unknown type:** *" + variableGr.getValue('type') + '*');
                            break;
                    }

                    context.pushListItemIfTrue(variableGr.global, markdownLines);
                    context.pushListItemIfTrue(variableGr.disable_initial_slot_fill, markdownLines);
                    context.pushDisplayValueListItem(variableGr.variable_width, markdownLines, multiLineStack);
                    context.pushListItemIfFalse(variableGr.visible_standalone, markdownLines);
                    context.pushListItemIfFalse(variableGr.visible_bundle, markdownLines);
                    context.pushListItemIfTrue(variableGr.not_available_conversation, markdownLines);
                    context.pushListItemIfFalse(variableGr.visible_guide, markdownLines);
                    context.pushListItemIfFalse(variableGr.visible_summary, markdownLines);
                    switch (type) {
                        case 20: // Container End
                        case 24: // Container Split
                        case 32: // Rich Text Label
                            break;
                        case 19: // Container Start
                            context.pushListItemIfTrue(variableGr.hidden, markdownLines);
                            break;
                        default:
                            context.pushListItemIfTrue(variableGr.mandatory, markdownLines);
                            if (!variableGr.mandatory) {
                                context.pushListItemIfTrue(variableGr.hidden, markdownLines);
                                context.pushListItemIfTrue(variableGr.read_only, markdownLines);
                            }
                            break;
                    }
                    switch (type) {
                        case 2: // Multi Line Text
                        case 7: // CheckBox
                        case 9: // Date
                        case 10: // Date/Time
                            context.pushCodeListItem(variableGr.default_value, 'text', markdownLines, multiLineStack);
                            break;
                        case 1: // Yes / No
                        case 3: // Multiple Choice
                        case 4: // Numeric Scale
                        case 6: // Single Line Text
                        case 16: // Wide Single Line Text
                        case 18: // Lookup Select Box
                        case 26: // Email
                        case 27: // URL
                        case 28: // IP Address
                        case 29: // Duration
                        case 5: // Select Box
                            context.pushCodeListItem(variableGr.default_value, 'text', markdownLines, multiLineStack, true);
                            break;
                        case 23: // HTML
                            if (gs.nil(variableGr.default_html_value))
                                context.pushCodeListItem(variableGr.default_value, 'text', markdownLines, multiLineStack);
                            else
                                context.pushCodeBlockListItem(variableGr.default_html_value, 'html', multiLineStack);
                            break;
                        case 32: // Rich Text Label
                            context.pushCodeBlockListItem(variableGr.rich_text, 'html', multiLineStack);
                            break;
                        case 19: // Container Start
                        case 20: // Container End
                        case 24: // Container Split
                            break;
                        default:
                            context.pushDisplayValueListItem(variableGr.default_value, markdownLines, multiLineStack);
                            break;
                    }

                    context.pushDisplayValueListItem(variableGr.example_text, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(variableGr.validate_regex, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(variableGr.roles_to_use_also_request_for, markdownLines, multiLineStack);
                    context.pushMultiLineItems(multiLineStack, markdownLines);

                    if (listChoices) {
                        var choiceGr = new GlideRecord('question_choice');
                        choiceGr.addQuery('question', variableGr.sys_id);
                        choiceGr.addQuery('inactive', false);
                        choiceGr.orderBy('order');
                        choiceGr.query();
                        if (choiceGr.next()) {
                            markdownLines.push('');
                            markdownLines.push('**Choices:**');
                            markdownLines.push('');
                            markdownLines.push('| Label | Value | Sequence |');
                            markdownLines.push('| ----- | ----- | -------- |');
                            do {
                                markdownLines.push("| " + MarkdownGenerationContext.escapeForTableCellMarkdown(choiceGr.getValue('text')) + " | " + MarkdownGenerationContext.minimalEscapeForTableCellMarkdown(choiceGr.getValue('value')) + " | " + choiceGr.getDisplayValue('order') + " |");
                            } while (choiceGr.next());
                        }
                    }

                    var n;
                    /** @type {({ action: UIPolicyActionInfo; policy: UIPolicyInfo; }[])} */
                    var policiesForThisVar = [];
                    for (n = 0; n < uiPolicies.length; n++) {
                        var policy = uiPolicies[n];
                        for (var p = 0; p < policy.actions.length; p++) {
                            var a = policy.actions[p];
                            if (a.variable == item.name)
                                policiesForThisVar.push({
                                    action: a,
                                    policy: policy
                                });
                        }
                    }
                    if (policiesForThisVar.length > 0) {
                        markdownLines.push(
                            '',
                            '**UI Policies:**',
                            '',
                            '| Applies on catalog items | Applies to catalog tasks | Applies to requested items | Mandatory | Visible | Hidden | Value action | Policy |',
                            '| ------------------------ | ------------------------ | -------------------------- | --------- | ------- | ------ | ------------ | ------ |'
                        );
                        if (policiesForThisVar.length > 0)
                            policiesForThisVar.sort(function(a, b) {
                                if (a.action.order) {
                                    if (!b.action.order)
                                        return 1;
                                    return a.action.order.value - b.action.order;
                                }
                                return b.action.order ? -1 : 0;
                            });
                        for (n = 0; n < policiesForThisVar.length; n++) {
                            var pa = policiesForThisVar[n];
                            markdownLines.push('| ' + (pa.policy.applies_catalog ? 'True' : 'False') + ' | ' + (pa.policy.applies_sc_task ? 'True' : 'False') + ' | ' + (pa.policy.applies_req_item ? 'True' : 'False') +
                                ' | ' + pa.action.mandatory + ' | ' + pa.action.visible + ' | ' + pa.action.disabled + ' | ' + pa.action.value_action +
                                ' | [' + pa.policy.short_description + '](#' + pa.policy.fragment + ') |');
                        }
                    }
                    var scriptsForThisVar = clientScripts.filter(
                        /**
                         * @param {ClientScriptInfo} cs 
                         * @this {QuestionItem}
                         */
                        function(cs) {
                            return cs.variable == this.name;
                        }, item
                    );
                    if (scriptsForThisVar.length > 0) {
                        markdownLines.push(
                            '',
                            '**Catalog Client Scripts:**',
                            '',
                            '| Catalog Client Script | Applies on catalog items | Applies to catalog tasks | Applies to requested items |',
                            '| --------------------- | ------------------------ | ------------------------ | -------------------------- |'
                        );
                        for (n = 0; n < scriptsForThisVar.length; n++) {
                            /** @type {ClientScriptInfo} */
                            var scr = scriptsForThisVar[n];
                            markdownLines.push('| [' + scr.name + '](#' + scr.fragment + ') | ' + (scr.applies_catalog ? 'True' : 'False') + ' | ' + (scr.applies_sc_task ? 'True' : 'False') + ' | ' + (scr.applies_req_item ? 'True' : 'False') +
                                ' |');
                        }
                    }
                }
            }
        },

        /**
         * @param {string} conditionString
         * @param {MarkdownGenerationContext} context
         * @returns {string}
         */
        decodeConditionString: function(conditionString, context) {
            if (typeof conditionString != 'string')
                conditionString = '' + conditionString;
            if (conditionString == '')
                return '';

            var current_folder = context.getCurrentFolder();
            var match = idRe.exec(conditionString);
            var decoded = '';
            var startIndex = 0;
            while (match !== null) {
                if (match.index > startIndex)
                    decoded += conditionString.substring(startIndex, match.index);
                item = this.getVariableBySysId(match[1]);
                if (item) {
                    question_text = item.question_text ? item.question_text : item.name;
                    if (item.parent_sys_id == this._parent_sys_id)
                        decoded += '[' + MarkdownGenerationContext.escapeForMarkdown(question_text) + (item.set_map ? '](#variable-set-' : '](#variable-') + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                    else {
                        var link = (item.parent_type == "variable_set") ? context.mapper.getVarSetUrl(item.parent_sys_id, current_folder) : context.mapper.getCatItemUrl(item.parent_sys_id, current_folder);
                        decoded += '[' + MarkdownGenerationContext.escapeForMarkdown(question_text) + (item.set_map ? '](' + link + '#variable-set-' : '](' + link + '#variable-') + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ')';
                    }
                } else
                    decoded += match[0];
                startIndex = idRe.lastIndex;
                match = idRe.exec(conditionString);
            }
            if (startIndex < conditionString.length)
                decoded += conditionString.substring(startIndex);
            decoded = decoded.trim();

            var iml = encodedRe.test(decoded);
            if (iml) {
                decoded = decoded.replace(encodedRe, "\n  - $1^EQ\n  - *OR:* ");
                decoded = decoded.replace(/\^NQ ?/g, "^EQ\n  - *OR:* ");
            }
            decoded = decoded.replace(/\s?ISNOTEMPTY\^EQ/g, ' is not empty');
            decoded = decoded.replace(/\s?ISNOTEMPTY\^\s?/g, ' is not empty **AND** ');
            decoded = decoded.replace(/\s?ISEMPTY\^EQ/g, ' is empty');
            decoded = decoded.replace(/\s?ISEMPTY\^\s?/g, ' is empty **AND** ');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+),(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`, `$3`, `$4`');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`, `$3`');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+)\^EQ/g, ' is not one of `$1`, `$2`');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+),(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2`, `$3`, `$4` **AND** ');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2`, `$3` **AND** ');
            decoded = decoded.replace(/\s?NOT IN(\w+),(\w+)\^\s?/g, ' is not one of `$1`, `$2` **AND** ');
            decoded = decoded.replace(/\s?IN(\w+),(\w+),(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`, `$3`, `$4`');
            decoded = decoded.replace(/\s?IN(\w+),(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`, `$3`');
            decoded = decoded.replace(/\s?IN(\w+),(\w+)\^EQ/g, ' is one of `$1`, `$2`');
            decoded = decoded.replace(/\s?IN(\w+),(\w+),(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2`, `$3`, `$4` **AND** ');
            decoded = decoded.replace(/\s?IN(\w+),(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2`, `$3` **AND** ');
            decoded = decoded.replace(/\s?IN(\w+),(\w+)\^\s?/g, ' is one of `$1`, `$2` **AND** ');
            decoded = decoded.replace(/\s?!=(\w+)\^EQ/g, ' is not `$1`');
            decoded = decoded.replace(/\s?!=(\w+)\^\s?/g, ' is not `$1` **AND** ');
            decoded = decoded.replace(/\s?=(\w+)\^EQ/g, ' is `$1`');
            decoded = decoded.replace(/\s?=(\w+)\^\s?/g, ' is `$1` **AND** ');

            decoded = decoded.replace(/\s?!=\^EQ/g, ' is not empty');
            decoded = decoded.replace(/\s?!=\^\s?/g, ' is not empty **AND** ');
            decoded = decoded.replace(/\s?=\^EQ/g, ' is empty');
            decoded = decoded.replace(/\s?=\^\s?/g, ' is empty **AND** ');
            return iml ? decoded : ' ' + decoded;
        },

        initialize: function(parentGlideRecord) {
            if (gs.nil(parentGlideRecord))
                throw new Error("Parent record not provided.");
            if (parentGlideRecord instanceof GlideElement) {
                if (parentGlideRecord.getRefRecord) {
                    parentGlideRecord = parentGlideRecord.getRefRecord();
                    if (gs.nil(parentGlideRecord))
                        throw new Error("Parent record not provided.");
                } else
                    throw new Error("Parameter is not a record reference.");
            } else if (parentGlideRecord instanceof String) {
                var gr = new GlideRecord('sc_cat_item');
                if (gr.get(parentGlideRecord))
                    parentGlideRecord = gr;
                else {
                    gr = new GlideRecord('item_option_new_set');
                    if (gr.get(parentGlideRecord))
                        parentGlideRecord = gr;
                    else
                        throw new Error("Catalog item or Variable Set with ID " + JSON.stringify(parentGlideRecord) + " not found.");
                }
            } else if (!(parentGlideRecord instanceof GlideRecord || parentGlideRecord instanceof GlideRecord))
                throw new Error("Parameter must represent a Catalog Item or Variable Set.");

            this._parent_sys_id = parentGlideRecord.getUniqueValue();
            this._parent_display_value = MarkdownGenerationContext.minimalEscapeForMarkdown(parentGlideRecord.getDisplayValue());
            this._parent_table_name = parentGlideRecord.getTableName();
            this._parent_class_name = MarkdownGenerationContext.minimalEscapeForMarkdown(parentGlideRecord.getClassDisplayValue());
            if (gs.nil(this._parent_class_name))
                this._parent_class_name = this._parent_table_name;
            var variableGr = new GlideRecord('item_option_new');
            var gth = new GlideTableHierarchy(this._parent_table_name);
            var tableNames = gth.getTables();
            if (tableNames.indexOf('item_option_new_set') > -1) {
                this._parent_is_variable_set = true;
                if (gs.nil(this._parent_display_value)) {
                    this._parent_display_value = parentGlideRecord.getValue('internal_name');
                    if (gs.nil(this._parent_display_value))
                        this._parent_display_value = this._parent_sys_id;
                }
                variableGr.addQuery('variable_set', this._parent_sys_id);
            } else if (tableNames.indexOf('sc_cat_item') > -1) {
                if (gs.nil(this._parent_display_value))
                    this._parent_display_value = this._parent_sys_id;
                variableGr.addQuery('cat_item', this._parent_sys_id);
                this._parent_is_record_producer = tableNames.indexOf('sc_cat_item_producer') > -1;
            } else
                throw new Error("Glide Record table " + JSON.stringify(this._parent_table_name) + " does not inherit from Catalog Item or Variable Set.");
            variableGr.orderBy('order');
            variableGr.orderBy('name');
            variableGr.addActiveQuery();
            variableGr.query();
            /** @type {QuestionItem[]} */
            var allVariables = [];
            var parent_type = this._parent_is_variable_set ? "variable_set" : "catalog_item";
            /** @type {QuestionItem} */
            var item;
            while (variableGr.next()) {
                item = {
                    sys_id: variableGr.getValue('sys_id'),
                    type_value: parseInt(variableGr.getValue('type')),
                    type_label: MarkdownGenerationContext.escapeForMarkdown(variableGr.getDisplayValue('type')),
                    question_text: gs.nil(variableGr.question_text) ? '' : MarkdownGenerationContext.escapeForMarkdown(variableGr.getDisplayValue('question_text')),
                    name: variableGr.getValue('name'),
                    order: gs.nil(variableGr.order) ? {
                        display_value: '',
                        value: NaN
                    } : {
                        display_value: variableGr.getDisplayValue('order'),
                        value: parseInt(variableGr.getValue('order'))
                    },
                    parent_sys_id: this._parent_sys_id,
                    parent_type: parent_type
                };
                if (this._parent_is_record_producer && !gs.nil(variableGr.field))
                    item.field = {
                        value: MarkdownGenerationContext.minimalEscapeForMarkdown(variableGr.getValue('field')),
                        display_value: MarkdownGenerationContext.escapeForMarkdown(variableGr.getDisplayValue('field'))
                    };
                allVariables.push(item);
                this._bySysId[item.sys_id] = item;
                this._byName[item.name] = item;
            }
            if (this._parent_is_variable_set)
                this._allVariables = allVariables;
            else {
                var startingCount = allVariables.length;
                var varSetItemGr = new GlideRecord('io_set_item');
                varSetItemGr.addQuery('sc_cat_item', this._parent_sys_id);
                varSetItemGr.orderBy('order');
                varSetItemGr.orderBy('variable_set.internal_name');
                varSetItemGr.query();
                if (varSetItemGr.next()) {
                    do {
                        var varSetGr = varSetItemGr.variable_set.getRefRecord();
                        var setMap = new VariableMap(varSetGr);
                        item = {
                            sys_id: varSetItemGr.getValue('variable_set'),
                            type_value: NaN,
                            type_label: 'Variable Set',
                            question_text: setMap.getParentDisplayValue(),
                            name: varSetGr.getValue('internal_name'),
                            set_map: setMap,
                            order: gs.nil(varSetItemGr.order) ? {
                                display_value: '',
                                value: NaN
                            } : {
                                display_value: varSetItemGr.getDisplayValue('order'),
                                value: parseInt(varSetItemGr.getValue('order'))
                            },
                            parent_sys_id: this._parent_sys_id,
                            parent_type: parent_type
                        };
                        this._variableSets.push(item);
                        allVariables.push(item);
                        this._bySysId[item.sys_id] = item;
                        this._byName[item.name] = item;
                    } while (varSetItemGr.next());
                    if (startingCount > 0)
                        this._allVariables = allVariables.sort(function(a, b) {
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
                            if (a.name < b.name)
                                return -1;
                            return (a.name > b.name) ? 1 : 0;
                        });
                    else
                        this._allVariables = allVariables;
                } else
                    this._allVariables = allVariables;
            }
            var container_name = '';
            for (var i = 0; i < this._allVariables.length; i++) {
                item = this._allVariables[i];
                switch (item.type_value) {
                    case 19: // Container Start
                        container_name = item.question_text;
                        break;
                    case 24: // Container Split
                        if (container_name)
                            item.question_text = container_name;
                        break;
                    case 20: // Container End
                        if (container_name) {
                            item.question_text = container_name;
                            container_name = '';
                        }
                        break;
                }
            }
        },

        type: 'VariableMap'
    };

    return VariableMapConstructor;
})();
