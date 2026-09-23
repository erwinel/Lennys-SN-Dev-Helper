/** @type {TableMarkdownGeneratorConstructor} */
var TableMarkdownGenerator = (function() {
    /** @type {TableMarkdownGeneratorConstructor} */
    var TableMarkdownGeneratorConstructor = Class.create();

    var whiteSpaceRe = / \s*|(?! )\s+/g;
    var newLineRe = /\r?\n/g;

    /**
     * @param {GlideRecordSecure} tableGlideRecord - sys_db_object
     * @param {MarkdownGenerationContext} context
     * @returns {string}
     */
    function getTableMarkdown(tableGlideRecord, context) {
        var markdown = '# "' + MarkdownGenerationContext.escapeForMarkdown(tableGlideRecord.getValue('label')) + "\" Table\n\n";
        var markdownLines = [];
        var multiLineStack = [];
        markdownLines.push('- **Name:** [' + tableGlideRecord.name + '](' + MarkdownGenerationContext.getInstanceUrl('sys_db_object.do?sysparm_query=name%3D' + tableGlideRecord.name) + ')');
        context.pushTableReferenceListItem(tableGlideRecord.super_class, markdownLines);
        context.pushListItemIfTrue(tableGlideRecord.scriptable_table, markdownLines);
        context.pushListItemIfTrue(tableGlideRecord.is_extendable, markdownLines);
        if (!gs.nil(tableGlideRecord.number_ref)) {
            markdownLines.push("- **Prefix:** " + MarkdownGenerationContext.escapeForMarkdown(tableGlideRecord.getDisplayValue('number_ref.prefix')));
            markdownLines.push("- **Number:** " + MarkdownGenerationContext.escapeForMarkdown(tableGlideRecord.getDisplayValue('number_ref.number')));
            markdownLines.push("- **Number of digits:** " + MarkdownGenerationContext.escapeForMarkdown(tableGlideRecord.getDisplayValue('number_ref.maximum_digits')));
        }
        context.pushDisplayValueListItem(tableGlideRecord.access, markdownLines, multiLineStack);
        context.pushListItemIfFalse(tableGlideRecord.read_access, markdownLines);
        context.pushListItemIfFalse(tableGlideRecord.create_access, markdownLines);
        context.pushListItemIfFalse(tableGlideRecord.update_access, markdownLines);
        context.pushListItemIfFalse(tableGlideRecord.delete_access, markdownLines);
        context.pushListItemIfFalse(tableGlideRecord.ws_access, markdownLines);
        context.pushListItemIfTrue(tableGlideRecord.configuration_access, markdownLines);
        context.pushMultiLineItems(multiLineStack, markdownLines);
        markdown += markdownLines.join('\n') + "\n\n_______________________________________________";
        var table_name = tableGlideRecord.getValue('name');
        var elementGr = new GlideRecord('sys_dictionary');
        elementGr.addQuery('name', table_name);
        elementGr.addQuery('element', '!=', 'sys_id');
        elementGr.addQuery('element', '!=', 'sys_updated_by');
        elementGr.addQuery('element', '!=', 'sys_updated_on');
        elementGr.addQuery('element', '!=', 'sys_created_by');
        elementGr.addQuery('element', '!=', 'sys_mod_count');
        elementGr.addQuery('element', '!=', 'sys_created_on');
        elementGr.addQuery('sys_class_name', 'sys_dictionary');
        elementGr.addNotNullQuery('element');
        elementGr.orderBy('column_label');
        elementGr.query();
        var newFields = [];
        if (gs.nil(tableGlideRecord.super_class))
            while (elementGr.next()) {
                element = elementGr.getValue('element');
                label = gs.nil(elementGr.column_label) ? element : elementGr.getValue('column_label');
                newFields.push({
                    sys_id: elementGr.getUniqueValue(),
                    label: '[" + MarkdownGenerationContext.escapeForTableCellMarkdown(label) + "](#column-" + MarkdownGenerationContext.convertToHeadingFragment(label) + ")',
                    name: element,
                    type: elementGr.getDisplayValue('internal_type'),
                    reference: gs.nil(elementGr.reference) ? '         ' : context.getTableReferenceMdLink(elementGr.reference),
                    display: elementGr.getDisplayValue('display')
                });
            }
        else {
            var tables = new GlideTableHierarchy(table_name).getTables();
            tables.shift();
            var superTable = tables.shift();
            var superGr = new GlideRecord('sys_dictionary');
            superGr.addQuery('name', superTable);
            superGr.addNotNullQuery('element');
            superGr.query();
            var ignoreElements = [];
            while (superGr.next())
                ignoreElements.push(superGr.getValue('element'));
            while (tables.length > 0) {
                superTable = tables.shift();
                superGr = new GlideRecord('sys_dictionary');
                superGr.addQuery('name', superTable);
                superGr.addNotNullQuery('element');
                superGr.query();
                while (superGr.next()) {
                    var sen = superGr.getValue('element');
                    if (ignoreElements.indexOf(sen) < 0)
                        ignoreElements.push(sen);
                }
            }
            while (elementGr.next()) {
                element = elementGr.getValue('element');
                label = gs.nil(elementGr.column_label) ? element : elementGr.getValue('column_label');
                var newFieldItem = {
                    sys_id: elementGr.getUniqueValue(),
                    label: '[' + MarkdownGenerationContext.escapeForTableCellMarkdown(label) + "](#column-" + MarkdownGenerationContext.convertToHeadingFragment(label) + ')',
                    name: element,
                    type: elementGr.getDisplayValue('internal_type'),
                    reference: gs.nil(elementGr.reference) ? '         ' : context.getTableReferenceMdLink(elementGr.reference),
                    display: elementGr.getDisplayValue('display')
                };
                var dictionaryOverrideGr = new GlideRecord('sys_dictionary_override'); 
                dictionaryOverrideGr.addQuery('element', element);
                dictionaryOverrideGr.addQuery('base_table', table_name);
                dictionaryOverrideGr.query();
                if (ignoreElements.indexOf(element) < 0) {
                    if (dictionaryOverrideGr.next())
                        newFieldItem.dictionaryOverride = dictionaryOverrideGr.getUniqueValue();
                    newFields.push(newFieldItem);
                } else if (dictionaryOverrideGr.next()) {
                    newFieldItem.dictionaryOverride = dictionaryOverrideGr.getUniqueValue();
                    newFields.push(newFieldItem);
                } else {
                    var labelGr = new GlideRecord('sys_documentation');
                    labelGr.addQuery('element', element);
                    labelGr.addQuery('name', table_name);
                    labelGr.query();
                    if (labelGr.next())
                        newFields.push(newFieldItem);
                }
                // var dictionaryOverrideGr = new GlideRecord('sys_dictionary_override');
                // dictionaryOverrideGr.addQuery('element', element);
                // dictionaryOverrideGr.addQuery('base_table', table_name);
                // dictionaryOverrideGr.query();
                // if (ignoreElements.indexOf(element) < 0) {
                //     if (dictionaryOverrideGr.next()) {
                //         if (dictionaryOverrideGr.display_override == true)
                //             newFieldItem.display = dictionaryOverrideGr.getDisplayValue('display_override');
                //         newFieldItem.dictionaryOverride = dictionaryOverrideGr.getUniqueValue();
                //         newFields.push(newFieldItem);
                //     }
                // } else {
                //     dictionaryOverrideGr.addQuery('base_table', table_name);
                //     dictionaryOverrideGr.query();
                //     if (dictionaryOverrideGr.next()) {
                //         if (dictionaryOverrideGr.display_override == true)
                //             newFieldItem.display = dictionaryOverrideGr.getDisplayValue('display_override');
                //         newFieldItem.dictionaryOverride = dictionaryOverrideGr.getUniqueValue();
                //     }
                //     newFields.push(newFieldItem);
                // }
            }
        }
        if (newFields.length > 0) {
            markdown += "\n\n## Columns\n\n| Column label | Name | Type | Reference | Display |\n| ------------ | ---- | --------- | ------- |";
            var label, element;
            newFields.forEach(function(newFieldItem) {
                markdown += "\n| " + newFieldItem.label + " | " + newFieldItem.name + " | " + newFieldItem.type + " | " + newFieldItem.reference + " | " + newFieldItem.display + " |";
            });
            newFields.forEach(function(newFieldItem) {
                elementGr = new GlideRecord('sys_dictionary');
                var dictionaryOverrideGr;
                if (newFieldItem.dictionaryOverride) {
                    dictionaryOverrideGr = new GlideRecord('sys_dictionary_override');
                    dictionaryOverrideGr.get(newFieldItem.dictionaryOverride);
                }
                elementGr.get(newFieldItem.sys_id);
                element = elementGr.getValue('element');
                label = gs.nil(elementGr.column_label) ? element : elementGr.getValue('column_label');
                markdown += "\n\n### Column: " + label + "\n\n";
                markdownLines = [];
                multiLineStack = [];
                context.pushDisplayValueListItem(elementGr.internal_type, markdownLines, multiLineStack, true);
                if (!gs.nil(elementGr.comments))
                    context.pushDisplayValueListItem(elementGr.comments, markdownLines, multiLineStack, true);
                context.pushValueListItem(elementGr.element, markdownLines, multiLineStack);
                var fieldClassGr = elementGr.internal_type.getRefRecord();
                switch (fieldClassGr.getValue('name')) {
                    case "compressed": // Compressed; string
                    case "html": // HTML; string
                    case "password": // Password (1 Way Encrypted); string
                    case "password2": // Password (2 Way Encrypted); string
                    case "phone_number": // Phone Number (Unused); string
                    case "phone_number_e164": // Phone Number (E164); string
                    case "ph_number": // Phone Number; string
                    case "string": // String; string
                    case "url": // URL; string
                    case "wide_text": // Wide Text; string
                    case "wiki_text": // Wiki; string
                        context.pushDisplayValueListItem(elementGr.max_length, markdownLines, multiLineStack);
                        break;
                }
                context.pushListItemIfFalse(elementGr.active, markdownLines);
                context.pushListItemIfTrue(elementGr.function_field, markdownLines);
                if (dictionaryOverrideGr && dictionaryOverrideGr.read_only_override == true)
                    context.pushListItemIfTrue(dictionaryOverrideGr.read_only, markdownLines);
                else
                    context.pushListItemIfTrue(elementGr.read_only, markdownLines);
                if (dictionaryOverrideGr && dictionaryOverrideGr.mandatory_override == true)
                    context.pushListItemIfTrue(dictionaryOverrideGr.mandatory, markdownLines);
                else
                    context.pushListItemIfTrue(elementGr.mandatory, markdownLines);
                if (dictionaryOverrideGr && dictionaryOverrideGr.display_override == true)
                    markdownLines.push("- **" + MarkdownGenerationContext.escapeForMarkdown(elementGr.display.getLabel()) + ":** True");
                else
                    context.pushListItemIfTrue(elementGr.display, markdownLines);
                if (dictionaryOverrideGr && dictionaryOverrideGr.attributes_override == true)
                    context.pushValueListItem(dictionaryOverrideGr.attributes, markdownLines, multiLineStack);
                else
                    context.pushValueListItem(elementGr.attributes, markdownLines, multiLineStack);
                if (!gs.nil(elementGr.reference)) {
                    context.pushTableReferenceListItem(elementGr.reference, markdownLines);
                    context.pushDisplayValueListItem(elementGr.use_reference_qualifier, markdownLines, multiLineStack);
                    if (dictionaryOverrideGr && dictionaryOverrideGr.reference_qual_override == true)
                        context.pushDisplayValueListItem(dictionaryOverrideGr.reference_qual, markdownLines, multiLineStack);
                    else
                        context.pushDisplayValueListItem(elementGr.reference_qual_condition, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(elementGr.dynamic_ref_qual, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(elementGr.reference_key, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(elementGr.reference_cascade_rule, markdownLines, multiLineStack);
                    context.pushListItemIfTrue(elementGr.reference_floats, markdownLines);
                    context.pushListItemIfTrue(elementGr.dynamic_creation, markdownLines);
                }
                if (!gs.nil(elementGr.choice) && elementGr.getValue('choice') != '0')
                    context.pushDisplayValueListItem(elementGr.choice, markdownLines, multiLineStack);
                context.pushTableReferenceListItem(elementGr.choice_table, markdownLines);
                
                if (dictionaryOverrideGr && dictionaryOverrideGr.dependent_override == true)
                    context.pushListItemIfTrue(dictionaryOverrideGr.dependent, markdownLines);
                else
                    context.pushTableReferenceListItem(elementGr.dependent, markdownLines);
                if (elementGr.getDisplayValue('use_dependent_field') == 'true') {
                    context.pushListItemIfTrue(elementGr.use_dependent_field, markdownLines);
                    context.pushFieldReferenceListItem(tableGlideRecord.name, elementGr.dependent_on_field, markdownLines, table_name);
                }
                if (elementGr.getDisplayValue('virtual') == 'true') {
                    context.pushListItemIfTrue(elementGr.virtual, markdownLines);
                    context.pushCodeListItem(elementGr.formula, 'javascript', markdownLines, multiLineStack);
                }
                if (dictionaryOverrideGr && dictionaryOverrideGr.calculation_override == true)
                    context.pushValueListItem(dictionaryOverrideGr.calculation, markdownLines, multiLineStack);
                else
                    context.pushValueListItem(elementGr.calculation, markdownLines, multiLineStack);
                
                if (dictionaryOverrideGr && dictionaryOverrideGr.default_value_override == true)
                    context.pushListItemIfTrue(dictionaryOverrideGr.default_value, markdownLines);
                else
                    context.pushValueListItem(elementGr.default_value, markdownLines, multiLineStack);
                context.pushMultiLineItems(multiLineStack, markdownLines);
                markdown += markdownLines.join("\n");
                var aclGr = new GlideRecord('sys_security_acl');
                aclGr.addQuery(table_name + '.' + element);
                aclGr.query();
                if (aclGr.next()) {
                    markdown += "\n\n**Access Controls:**\n\n| Name | Decision Type | Question | Type | Active |\n| ---- | ------------- | -------- | ---- | ------ |";
                    do {
                        markdown += "\n| Name | Decision Type | Question | Type | Active |";
                    } while (aclGr.next);
                }
                var cGr = new GlideRecord('sys_choice');
                cGr.addQuery('name', table_name);
                cGr.addQuery('element', element);
                cGr.query();
                if (cGr.next()) {
                    var choices = [];
                    do {
                        var item = {
                            label: gs.nil(cGr.label) ? '*(empty)*' : MarkdownGenerationContext.escapeForTableCellMarkdown(cGr.getDisplayValue('label')),
                            value: gs.nil(cGr.value) ? '*(empty)*' : MarkdownGenerationContext.minimalEscapeForTableCellMarkdown(cGr.getDisplayValue('value')),
                            language: gs.nil(cGr.language) ? '*(empty)*' : MarkdownGenerationContext.escapeForTableCellMarkdown(cGr.getDisplayValue('language')),
                            hint: gs.nil(cGr.language) ? '' : MarkdownGenerationContext.escapeForTableCellMarkdown(cGr.getDisplayValue('hint')),
                            sequence: cGr.getDisplayValue('sequence'),
                            inactive: cGr.inactive ? 'True' : 'False'
                        };
                        var noMatch = true;
                        for (i = 0; i < choices.length; i++) {
                            var ci = choices[i];
                            if (ci.label == item.label && ci.value == item.value && ci.language == item.language && ci.hint == item.hint && ci.sequence == item.sequence && ci.inactive == item.inactive) {
                                noMatch = false;
                                break;
                            }
                        }
                        if (noMatch)
                            choices.push(item);
                    } while (cGr.next());
                    var showLanguage = false;
                    var i;
                    var lang = choices[0].language;
                    for (i = 1; i < choices.length; i++) {
                        if (choices[i].language != lang) {
                            showLanguage = true;
                            break;
                        }
                    }
                    var showHint = false;
                    for (i = 0; i < choices.length; i++) {
                        if (choices[i].hint != '') {
                            showHint = true;
                            break;
                        }
                    }
                    var showInactive = false;
                    for (i = 0; i < choices.length; i++) {
                        if (choices[i].inactive != 'False') {
                            showInactive = true;
                            break;
                        }
                    }
                    if (showLanguage) {
                        if (showHint) {
                            if (showInactive) {
                                markdown += "\n\n**Choices:**\n\n| Label | Value | Language | Hint | Sequence | Inactive |\n| ----- | ----- | -------- | ---- | -------- | -------- |";
                                for (i = 0; i < choices.length; i++)
                                    markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].language + ' | ' + choices[i].hint + ' | ' + choices[i].sequence + ' | ' + choices[i].inactive + ' |';
                            } else {
                                markdown += "\n\n**Choices:**\n\n| Label | Value | Language | Hint | Sequence |\n| ----- | ----- | -------- | ---- | -------- |";
                                for (i = 0; i < choices.length; i++)
                                    markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].language + ' | ' + choices[i].hint + ' | ' + choices[i].sequence + ' |';
                            }
                        } else if (showInactive) {
                            markdown += "\n\n**Choices:**\n\n| Label | Value | Language | Sequence | Inactive |\n| ----- | ----- | -------- | -------- | -------- |";
                            for (i = 0; i < choices.length; i++)
                                markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].language + ' | ' + choices[i].sequence + ' | ' + choices[i].inactive + ' |';
                        } else {
                            markdown += "\n\n**Choices:**\n\n| Label | Value | Language | Sequence |\n| ----- | ----- | -------- | -------- |";
                            for (i = 0; i < choices.length; i++)
                                markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].language + ' | ' + choices[i].sequence + ' |';
                        }
                    } else if (showHint) {
                        if (showInactive) {
                            markdown += "\n\n**Choices:**\n\n| Label | Value | Hint | Sequence | Inactive |\n| ----- | ----- | ---- | -------- | -------- |";
                            for (i = 0; i < choices.length; i++)
                                markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].hint + ' | ' + choices[i].sequence + ' | ' + choices[i].inactive + ' |';
                        } else {
                            markdown += "\n\n**Choices:**\n\n| Label | Value | Hint | Sequence |\n| ----- | ----- | ---- | -------- |";
                            for (i = 0; i < choices.length; i++)
                                markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].hint + ' | ' + choices[i].sequence + ' |';
                        }
                    } else if (showInactive) {
                        markdown += "\n\n**Choices:**\n\n| Label | Value | Sequence | Inactive |\n| ----- | ----- | -------- | -------- |";
                        for (i = 0; i < choices.length; i++)
                            markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].sequence + ' | ' + choices[i].inactive + ' |';
                    } else {
                        markdown += "\n\n**Choices:**\n\n| Label | Value | Sequence |\n| ----- | ----- | -------- |";
                        for (i = 0; i < choices.length; i++)
                            markdown += "\n| " + choices[i].label + ' | ' + choices[i].value + ' | ' + choices[i].sequence + ' |';
                    }
                }
            });
        }
        return markdown.trim() + "\n";
    }

    TableMarkdownGeneratorConstructor.getTableMarkdown = getTableMarkdown;

    TableMarkdownGeneratorConstructor.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
        getTableMarkdown: function() {
            try {
                var sys_id = this.getParameter('sysparm_sys_id');
                if (!sys_id)
                    return "Value for sys_id parameter not provided.";
                var tableGlideRecord;
                try {
                    tableGlideRecord = new GlideRecord('sys_db_object');
                    if (!tableGlideRecord.get(sys_id))
                        return "Table with sys_id " + JSON.stringify(sys_id) + " not found.";
                } catch (e) {
                    return "Error loading table with sys_id " + JSON.stringify(sys_id) + ": " + e;
                }
                var context = new MarkdownGenerationContext();
                context.setCurrentFolder(this.getParameter('sysparm_folder'));
                return getTableMarkdown(tableGlideRecord, context);
            } catch (e) {
                return "Unexpected error: " + (e.stack ? e + "\nStack: " + e.stack : e);
            }
        },

        type: 'TableMarkdownGenerator'
    });

    return TableMarkdownGeneratorConstructor;
})();
