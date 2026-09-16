var ServiceCatalogMarkdownGenerator = (function() {
    /** @type {ServiceCatalogMarkdownGeneratorConstructor} */
    ServiceCatalogMarkdownGeneratorConstructor = Class.create();

    /**
     * @param {(GlideRecord | GlideRecordSecure)} catItemGr - sc_cat_item
     * @param {string[]} markdownLines
     * @param {MarkdownGenerationContext} context
     */
    function pushAvailabilitySection(catItemGr, markdownLines, context) {
        var catItemSysId = catItemGr.getUniqueValue();
        var availGr = new GlideRecord('sc_cat_item_user_criteria_mtom');
        availGr.addQuery('sc_cat_item', catItemSysId);
        availGr.orderBy('user_criteria.name');
        availGr.query();
        var notAvailGr = new GlideRecord('sc_cat_item_user_criteria_no_mtom');
        notAvailGr.addQuery('sc_cat_item', catItemSysId);
        notAvailGr.orderBy('user_criteria.name');
        notAvailGr.query();
        if (!(availGr.hasNext() || notAvailGr.hasNext()))
            return;

        markdownLines.push('', '## Availability');

        if (availGr.next()) {
            markdownLines.push('', '**Available for:**', '');
            do {
                markdownLines.push('- ' + MarkdownGenerationContext.escapeForMarkdown(availGr.getDisplayValue('user_criteria')));
            } while (availGr.next());
        }

        if (notAvailGr.next()) {
            markdownLines.push('', '**Not available for:**', '');
            do {
                markdownLines.push('- ' + MarkdownGenerationContext.escapeForMarkdown(notAvailGr.getDisplayValue('user_criteria')));
            } while (notAvailGr.next());
        }
    }

    var emptyFuncRe = /^[\r\n\s]*function\s+onCondition\s*\(\s*\)[\r\n\s]*\{[\r\n\s]*\}[\r\n\s]*$/g;

    /**
     * @param {string} filterField
     * @param {string} filterValue
     * @param {(VariableMap)} varMap
     * @param {string[]} markdownLines
     * @param {MarkdownGenerationContext} context
     */
    function pushCatalogUiPoliciesSection(filterField, filterValue, varMap, markdownLines, context) {
        var policyGr = new GlideRecord('catalog_ui_policy');
        policyGr.addActiveQuery();
        policyGr.addQuery(filterField, filterValue);
        policyGr.orderBy('short_description');
        policyGr.query();
        if (!policyGr.next())
            return;

        var question_text;
        markdownLines.push('', '## Catalog UI Policies');
        do {
            markdownLines.push('', '### UI Policy: ' + MarkdownGenerationContext.escapeForMarkdown(policyGr.getValue('short_description')), '');
            /** @type {tyLabeledMultilineStackItem[]} */
            var multiLineStack = [];
            /** @type {(QuestionItem | undefined)} */
            var item = undefined;
            if (!gs.nil(policyGr.catalog_conditions))
                markdownLines.push("- **Catalog conditions:**" + varMap.decodeConditionString(policyGr.getValue('catalog_conditions'), context));
            context.pushListItemIfTrue(policyGr.applies_catalog, markdownLines);
            context.pushListItemIfTrue(policyGr.applies_sc_task, markdownLines);
            context.pushListItemIfTrue(policyGr.applies_req_item, markdownLines);
            context.pushListItemIfTrue(policyGr.on_load, markdownLines);
            context.pushListItemIfTrue(policyGr.reverse_if_false, markdownLines);
            context.pushListItemIfTrue(policyGr.run_scripts, markdownLines);
            if (policyGr.getDisplayValue('run_scripts') == 'true')
                context.pushDisplayValueListItem(policyGr.ui_type, markdownLines, multiLineStack);
            context.pushMultiLineItems(multiLineStack, markdownLines);
            if (!gs.nil(policyGr.description))
                markdownLines.push('', "**Description:**", '', '```text', policyGr.getValue('description'), '```');

            var actionGr = new GlideRecord('catalog_ui_policy_action');
            actionGr.addQuery('ui_policy', policyGr.getUniqueValue());
            actionGr.orderBy('variable');
            actionGr.query();
            if (actionGr.next()) {
                markdownLines.push('', '**Catalog UI Policy Actions:**', '', '| Name | Mandatory | Visible | Read only | Order | Value action |', '| ---- | --------- | ------- | --------- | ----- | ------------ |');
                do {
                    var vn = actionGr.getValue('variable');
                    item = varMap.getVariableByName(vn);
                    if (!item) {
                        markdownLines.push('| ' + vn + ' *\\(not found\\)* | Mandatory | Visible | Read only | Order | Value action |');
                        continue;
                    }
                    question_text = item.question_text ? item.question_text : item.name;
                    var lineText = "| [" + MarkdownGenerationContext.escapeForTableCellMarkdown(question_text) + ((typeof item !== 'undefined' && item.set_map) ? "](#variable-set-" : "](#variable-") + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ") | ";
                    switch (actionGr.getValue('mandatory')) {
                        case 'true':
                            lineText += 'True |';
                            break;
                        case 'false':
                            lineText += 'False |';
                            break;
                        default:
                            lineText += 'Leave alone |';
                            break;
                    }
                    switch (actionGr.getValue('visible')) {
                        case 'true':
                            lineText += 'True |';
                            break;
                        case 'false':
                            lineText += 'False |';
                            break;
                        default:
                            lineText += 'Leave alone |';
                            break;
                    }
                    switch (actionGr.getValue('disabled')) {
                        case 'true':
                            lineText += 'True |';
                            break;
                        case 'false':
                            lineText += 'False |';
                            break;
                        default:
                            lineText += 'Leave alone |';
                            break;
                    }
                    if (gs.nil(actionGr.order))
                        lineText += ' |';
                    else
                        lineText += actionGr.getDisplayValue('order') + ' |';
                    if (actionGr.cleared)
                        lineText += "Clear value |";
                    else
                        switch (actionGr.getValue('value_action')) {
                            case 'clear_value':
                                lineText += 'Clear value |';
                                break;
                            case 'set_value':
                                lineText += 'Set value: ' +  MarkdownGenerationContext.escapeForTableCellMarkdown(actionGr.getDisplayValue('value')) + ' |';
                                break;
                            default:
                                lineText += 'Leave alone |';
                                break;
                        }
                    markdownLines.push(lineText);
                } while (actionGr.next());
            }

            if (policyGr.getDisplayValue('run_scripts') == 'true') {
                var scriptText;
                if (!gs.nil(policyGr.script_true)) {
                    scriptText = policyGr.getValue('script_true');
                    if (!emptyFuncRe.test(scriptText))
                        markdownLines.push('', '**Execute if true:**', '', '```javascript', scriptText, '```');
                }
                if (!gs.nil(policyGr.script_false)) {
                    scriptText = policyGr.getValue('script_false');
                    if (!emptyFuncRe.test(scriptText))
                        markdownLines.push('', '**Execute if false:**', '', '```javascript', scriptText, '```');
                }
            }
        } while (policyGr.next());
    }

    /**
     * @param {string} filterField
     * @param {string} filterValue
     * @param {(VariableMap)} varMap
     * @param {string[]} markdownLines
     * @param {MarkdownGenerationContext} context
     */
    function pushCatalogClientScriptsSection(filterField, filterValue, varMap, markdownLines, context) {
        var scriptGr = new GlideRecord('catalog_script_client');
        scriptGr.addActiveQuery();
        scriptGr.addQuery(filterField, filterValue);
        scriptGr.orderBy('name');
        scriptGr.query();
        if (!scriptGr.hasNext())
            return;

        markdownLines.push('', '## Client Scripts');

        while (scriptGr.next()) {
            /** @type {tyLabeledMultilineStackItem[]} */
            var multiLineStack = [];
            markdownLines.push('', '### Client Script: ' + scriptGr.getValue('name'), '');
            context.pushDisplayValueListItem(scriptGr.applies_to, markdownLines, multiLineStack);
            context.pushDisplayValueListItem(scriptGr.ui_type, markdownLines, multiLineStack);
            context.pushDisplayValueListItem(scriptGr.type, markdownLines, multiLineStack);
            if (scriptGr.type == 'onChange' && !gs.nil(scriptGr.cat_variable)) {
                /** @type {(QuestionItem | undefined)} */
                var item = undefined;
                var id = scriptGr.getValue('cat_variable');
                if (id.startsWith('IO:') && id.length > 3)
                    item = varMap.getVariableBySysId(id.substring(3));
                if (item) {
                    var question_text = item.question_text ? item.question_text : item.name;
                    markdownLines.push("- **Variable name:** [" + MarkdownGenerationContext.escapeForMarkdown(question_text) + (item.set_map ? "](#variable-set-" : "](#variable-") + MarkdownGenerationContext.convertToHeadingFragment(question_text) + ")");
                } else
                    markdownLines.push("- **Variable name:** `" + id + "`");
            }
            context.pushDisplayValueListItem(scriptGr.order, markdownLines, multiLineStack);
            context.pushListItemIfTrue(scriptGr.applies_catalog, markdownLines);
            context.pushListItemIfTrue(scriptGr.applies_req_item, markdownLines);
            context.pushListItemIfTrue(scriptGr.applies_sc_task, markdownLines);
            context.pushListItemIfTrue(scriptGr.applies_extended, markdownLines);
            context.pushListItemIfTrue(scriptGr.global, markdownLines);
            context.pushListItemIfFalse(scriptGr.isolate_script, markdownLines);
            context.pushMultiLineItems(multiLineStack, markdownLines);
            if (!gs.nil(scriptGr.description))
                markdownLines.push('', "**Description:**", '', '```text', scriptGr.getValue('description'), '```');
            if (!gs.nil(scriptGr.script))
                markdownLines.push('', "**Script:**", '', '```javascript', scriptGr.getValue('script'), '```');
        }
    }

    // /** @typedef {(QuestionItemOld & { field: string })} RecordProducerQuestionItemOld */

    /**
     * @param {(GlideRecord | GlideRecordSecure)} catItemGr - sc_cat_item_producer
     * @param {MarkdownGenerationContext} context
     * @return {string}
     */
    function getRecordProducerMarkdown(catItemGr, context) {
        /** @type {string[]} */
        var markdownLines = ['# "' + MarkdownGenerationContext.escapeForMarkdown(catItemGr.getValue('name')) + '" Record Producer', ''];
        /** @type {tyLabeledMultilineStackItem[]} */
        var multiLineStack = [];
        context.pushTableReferenceListItem(catItemGr.table_name, markdownLines);
        context.pushDisplayValueListItem(catItemGr.short_description, markdownLines, multiLineStack);
        context.pushCodeBlockListItem(catItemGr.description, 'html', multiLineStack);
        context.pushDisplayValueListItem(catItemGr.meta, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.redirect_url, markdownLines, multiLineStack);
        context.pushImageListItem(catItemGr.icon, markdownLines);
        context.pushImageListItem(catItemGr.picture, markdownLines);
        context.pushDisplayValueListItem(catItemGr.sc_catalogs, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.category, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.view, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.roles, markdownLines, multiLineStack);
        context.pushListItemIfTrue(catItemGr.can_cancel, markdownLines);
        context.pushDisplayValueListItem(catItemGr.template, markdownLines, multiLineStack);
        context.pushListItemIfTrue(catItemGr.no_attachment_v2, markdownLines);
        context.pushListItemIfTrue(catItemGr.mandatory_attachment, markdownLines);
        context.pushListItemIfTrue(catItemGr.no_save_as_draft, markdownLines);
        var cat_item_sys_id = catItemGr.getValue('sys_id');
        markdownLines.push('- **Links:** [Dev](' + MarkdownGenerationContext.getInstanceUrl('nav_to.do?uri=sc_cat_item_producer.do?sys_id=' + cat_item_sys_id) + ')');
        context.pushMultiLineItems(multiLineStack, markdownLines);

        markdownLines.push('', '_______________________________________________');

        /** @type {VariableMap} */
        var varMap = new VariableMap(catItemGr);
        varMap.pushVariablesSectionMarkdown(context, markdownLines);

        context.pushClodeBlock(catItemGr.script, 'javascript', markdownLines, 2);

        pushAvailabilitySection(catItemGr, markdownLines, context);
        pushCatalogUiPoliciesSection('catalog_item', catItemGr.getUniqueValue(), varMap, markdownLines, context);
        pushCatalogClientScriptsSection('cat_item', catItemGr.getUniqueValue(), varMap, markdownLines, context);

        return markdownLines.join("\n") + "\n";
    }

    ServiceCatalogMarkdownGeneratorConstructor.getRecordProducerMarkdown = getRecordProducerMarkdown;

    /**
     * @param {(GlideRecord | GlideRecordSecure)} catItemGr - sc_cat_item
     * @param {MarkdownGenerationContext} context
     * @return {string}
     */
    function getCatalogItemMarkdown(catItemGr, context) {
        switch (catItemGr.getValue('sys_class_name')) {
            case 'sc_cat_item_producer':
                var rpGr = new GlideRecord('sc_cat_item_producer');
                rpGr.get(sys_id);
                return getRecordProducerMarkdown(catItemGr, context);
        }
        /** @type {string[]} */
        var markdownLines = ['# "' + MarkdownGenerationContext.escapeForMarkdown(catItemGr.getValue('name')) + '" Catalog Item', ''];
        /** @type {tyLabeledMultilineStackItem[]} */
        var multiLineStack = [];
        context.pushDisplayValueListItem(catItemGr.short_description, markdownLines, multiLineStack);
        context.pushCodeBlockListItem(catItemGr.description, 'html', multiLineStack);
        context.pushDisplayValueListItem(catItemGr.sc_catalogs, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.category, markdownLines, multiLineStack);
        context.pushValueListItem(catItemGr.roles, markdownLines, multiLineStack);
        if (!gs.nil(catItemGr.fulfillment_automation_level) && catItemGr.fulfillment_automation_level != 'unspecified')
            context.pushDisplayValueListItem(catItemGr.fulfillment_automation_level, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.group, markdownLines);
        if (catItemGr.order != '0')
            context.pushDisplayValueListItem(catItemGr.order, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(catItemGr.meta, markdownLines, multiLineStack);
        if (gs.nil(catItemGr.flow_designer_flow))
            context.pushDisplayValueListItem(gs.nil(catItemGr.workflow) ? catItemGr.workflow : catItemGr.delivery_plan, markdownLines, multiLineStack);
        else
            context.pushFlowReferenceListItem(catItemGr.flow_designer_flow, markdownLines);
        context.pushImageListItem(catItemGr.icon, markdownLines);
        context.pushImageListItem(catItemGr.picture, markdownLines);
        context.pushDisplayValueListItem(catItemGr.request_method, markdownLines, multiLineStack);
        context.pushListItemIfTrue(catItemGr.no_cart_v2, markdownLines);
        context.pushListItemIfTrue(catItemGr.no_quantity_v2, markdownLines);
        context.pushListItemIfTrue(catItemGr.no_delivery_time_v2, markdownLines);
        context.pushListItemIfTrue(catItemGr.no_save_as_draft, markdownLines);
        context.pushListItemIfTrue(catItemGr.no_attachment_v2, markdownLines);
        context.pushListItemIfTrue(catItemGr.mandatory_attachment, markdownLines);
        var cat_item_sys_id = catItemGr.getValue('sys_id');
        markdownLines.push('- **Links:** [Dev](' + MarkdownGenerationContext.getInstanceUrl('nav_to.do?uri=sc_cat_item.do?sys_id=' + cat_item_sys_id) + ')');
        context.pushMultiLineItems(multiLineStack, markdownLines);

        markdownLines.push('', '_______________________________________________');

        /** @type {VariableMap} */
        var varMap = new VariableMap(catItemGr);
        varMap.pushVariablesSectionMarkdown(context, markdownLines);

        pushAvailabilitySection(catItemGr, markdownLines, context);
        pushCatalogUiPoliciesSection('catalog_item', catItemGr.getUniqueValue(), varMap, markdownLines, context);
        pushCatalogClientScriptsSection('cat_item', catItemGr.getUniqueValue(), varMap, markdownLines, context);

        return markdownLines.join("\n") + "\n";
    }

    ServiceCatalogMarkdownGeneratorConstructor.getCatalogItemMarkdown = getCatalogItemMarkdown;

    /**
     * @param {(GlideRecord | GlideRecordSecure)} varSetGr - item_option_new_set
     * @param {MarkdownGenerationContext} context
     * @return {string}
     */
    function getVariableSetMarkdown(varSetGr, context) {
        /** @type {string[]} */
        var markdownLines = ['# "' + MarkdownGenerationContext.escapeForMarkdown(varSetGr.getValue(gs.nil(varSetGr.title) ? 'internal_name' : 'title')) + '" Variable Set', ''];
        /** @type {tyLabeledMultilineStackItem[]} */
        var multiLineStack = [];
        context.pushValueListItem(varSetGr.internal_name, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(varSetGr.order, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(varSetGr.type, markdownLines, multiLineStack);
        context.pushListItemIfTrue(varSetGr.display_title, markdownLines);
        context.pushDisplayValueListItem(varSetGr.layout, markdownLines, multiLineStack);
        context.pushDisplayValueListItem(varSetGr.description, markdownLines, multiLineStack);
        var var_set_sys_id = varSetGr.getValue('sys_id');
        markdownLines.push('- **Links:** [Dev](' + MarkdownGenerationContext.getInstanceUrl('nav_to.do?uri=item_option_new_set.do?sys_id=' + var_set_sys_id) + ')');
        context.pushMultiLineItems(multiLineStack, markdownLines);

        markdownLines.push('', '_______________________________________________');

        /** @type {VariableMap} */
        var varMap = new VariableMap(varSetGr);
        varMap.pushVariablesSectionMarkdown(context, markdownLines);

        pushCatalogUiPoliciesSection('variable_set', varSetGr.getUniqueValue(), varMap, markdownLines, context);
        pushCatalogClientScriptsSection('variable_set', varSetGr.getUniqueValue(), varMap, markdownLines, context);

        return markdownLines.join("\n") + "\n";
    }

    ServiceCatalogMarkdownGeneratorConstructor.getVariableSetMarkdown = getVariableSetMarkdown;

    ServiceCatalogMarkdownGeneratorConstructor.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
        getCatalogItemMarkdown: function() {
            try {
                var sys_id = this.getParameter('sysparm_sys_id');
                if (!sys_id)
                    return "Value for sys_id parameter not provided.";
                var catItemGr;
                try {
                    catItemGr = new GlideRecord('sc_cat_item');
                    if (!catItemGr.get(sys_id))
                        return "Catalog Item with sys_id " + JSON.stringify(sys_id) + " not found.";
                    sys_class_name = catItemGr.getValue('sys_class_name');
                    if (sys_class_name == 'sc_cat_item_producer') {
                        catItemGr = new GlideRecord('sc_cat_item_producer');
                        if (!catItemGr.get(sys_id))
                            return "Record Producer with sys_id " + JSON.stringify(sys_id) + " not found.";
                    }
                } catch (e) {
                    return "Error loading catalog item with sys_id " + JSON.stringify(sys_id) + ": " + e;
                }
                var context = new MarkdownGenerationContext();
                context.setCurrentFolder(this.getParameter('sysparm_folder'));
                return (sys_class_name == 'sc_cat_item_producer') ? getRecordProducerMarkdown(catItemGr, context) : getCatalogItemMarkdown(catItemGr, context);
            } catch (e) {
                return "Unexpected error: " + (e.stack ? e + "\nStack: " + e.stack : e);
            }
        },

        getVariableSetMarkdown: function() {
            try {
                var sys_id = this.getParameter('sysparm_sys_id');
                if (!sys_id)
                    return "Value for sys_id parameter not provided.";
                var varSetGr;
                try {
                    varSetGr = new GlideRecord('item_option_new_set');
                    if (!varSetGr.get(sys_id))
                        return "Variable Set with sys_id " + JSON.stringify(sys_id) + " not found.";
                } catch (e) {
                    return "Error loading variable set with sys_id " + JSON.stringify(sys_id) + ": " + e;
                }
                var context = new MarkdownGenerationContext();
                context.setCurrentFolder(this.getParameter('sysparm_folder'));
                return getVariableSetMarkdown(varSetGr, context);
            } catch (e) {
                return "Unexpected error: " + (e.stack ? e + "\nStack: " + e.stack : e);
            }
        },

        type: 'ServiceCatalogMarkdownGenerator'
    });
    return ServiceCatalogMarkdownGeneratorConstructor;
})();