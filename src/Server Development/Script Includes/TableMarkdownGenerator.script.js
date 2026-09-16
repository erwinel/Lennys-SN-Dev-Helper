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
        var name = tableGlideRecord.getValue('name');
        var gr = new GlideRecord('sys_dictionary');
        gr.addQuery('name', name);
        gr.addQuery('element', '!=', 'sys_id');
        gr.addQuery('element', '!=', 'sys_updated_by');
        gr.addQuery('element', '!=', 'sys_updated_on');
        gr.addQuery('element', '!=', 'sys_created_by');
        gr.addQuery('element', '!=', 'sys_mod_count');
        gr.addQuery('element', '!=', 'sys_created_on');
        gr.addNotNullQuery('element');
        gr.orderBy('column_label');
        gr.query();
        if (gr.next()) {
            markdown += "\n\n## Columns\n\n| Column label | Type | Reference | Display |\n| ------------ | ---- | --------- | ------- |";
            var label, element;
            do {
                element = gr.getValue('element');
                label = gs.nil(gr.column_label) ? element : gr.getValue('column_label');
                markdown += "\n| [" + MarkdownGenerationContext.escapeForTableCellMarkdown(label) + "](#column-" + MarkdownGenerationContext.convertToHeadingFragment(label) + ") | " +
                    gr.getDisplayValue('internal_type');
                if (gs.nil(gr.reference))
                    markdown += " |           | ";
                else
                    markdown += " | " + context.getTableReferenceMdLink(gr.reference) + " | ";
                markdown += gr.display ? "True |" : "False |";
            } while (gr.next());
            gr = new GlideRecord('sys_dictionary');
            gr.addQuery('name', name);
            gr.addQuery('element', '!=', 'sys_id');
            gr.addQuery('element', '!=', 'sys_updated_by');
            gr.addQuery('element', '!=', 'sys_updated_on');
            gr.addQuery('element', '!=', 'sys_created_by');
            gr.addQuery('element', '!=', 'sys_mod_count');
            gr.addQuery('element', '!=', 'sys_created_on');
            gr.addNotNullQuery('element');
            gr.orderBy('column_label');
            gr.query();
            while (gr.next()) {
                element = gr.getValue('element');
                label = gs.nil(gr.column_label) ? element : gr.getValue('column_label');
                markdown += "\n\n### Column: " + label + "\n\n";
                markdownLines = [];
                multiLineStack = [];
                context.pushDisplayValueListItem(gr.internal_type, markdownLines, multiLineStack, true);
                if (!gs.nil(gr.comments))
                    context.pushDisplayValueListItem(gr.comments, markdownLines, multiLineStack, true);
                context.pushValueListItem(gr.element, markdownLines, multiLineStack);
                var fieldClassGr = gr.internal_type.getRefRecord();
                // switch (fieldClassGr.getValue('name')) {
                //     case "action_conditions": // Action Conditions; string
                //     case "approval_rules": // Approval Rules; string
                //     case "audio": // Audio; string
                //     case "auto_increment": // Auto Increment; longint
                //     case "auto_number": // Auto Number; string
                //     case "boolean": // True/False; boolean
                //     case "bootstrap_color": // Bootstrap color; string
                //     case "breakdown_element": // Breakdown Element; GUID
                //     case "calendar_date_time": // Calendar Date/Time; datetime
                //     case "catalog_preview": // Catalog Preview; string
                //     case "char": // Char; GUID
                //     case "choice": // Choice; string
                //     case "collection": // Collection; string
                //     case "color": // Color; string
                //     case "color_display": // Color Display; string
                //     case "composite_field": // Composite Field; string
                //     case "composite_name": // Composite Name; string
                //     case "compressed": // Compressed; string
                //     case "conditions": // Conditions; string
                //     case "condition_string": // Condition String; string
                //     case "counter": // Counter; string
                //     case "css": // CSS; string
                //     case "currency": // Currency; decimal
                //     case "currency2": // FX Currency; GUID
                //     case "data_array": // Data Array; string
                //     case "data_object": // Data Object; string
                //     case "data_structure": // Data Structure; string
                //     case "date": // Other Date; date
                //     case "datetime": // Basic Date/Time; datetime
                //     case "days_of_week": // Days of Week; string
                //     case "day_of_week": // Day of Week; integer
                //     case "decimal": // Decimal; decimal
                //     case "decoration": // Decoration; string
                //     case "documentation_field": // Documentation Field; string
                //     case "document_id": // Document ID; GUID
                //     case "domain_id": // Domain ID; GUID
                //     case "domain_path": // Domain Path; string
                //     case "due_date": // Due Date; datetime
                //     case "dynamic_attribute_store": // Dynamic Attribute Store; string
                //     case "email": // Email; string
                //     case "email_script": // Email Script; string
                //     case "expression": // Expression; string
                //     case "external_names": // External Names; string
                //     case "field_list": // Field List; string
                //     case "field_name": // Field Name; string
                //     case "file_attachment": // File Attachment; string
                //     case "float": // Floating Point Number; float
                //     case "formula": // Formula; string
                //     case "geo_point": // Geo Point; string
                //     case "glide_action_list": // UI Action List; string
                //     case "glide_date": // Date; date
                //     case "glide_date_time": // Date/Time; datetime
                //     case "glide_duration": // Duration; datetime
                //     case "glide_list": // List; string
                //     case "glide_precise_time": // Precise Time; string
                //     case "glide_time": // Time; datetime
                //     case "glide_utc_time": // UTC Time; datetime
                //     case "glide_var": // Glide Var; string
                //     case "glyphicon": // Glyph Icon (Bootstrap); string
                //     case "graphql_schema": // GraphQL Schema; string
                //     case "GUID": // Sys ID (GUID); string
                //     case "html": // HTML; string
                //     case "html_script": // HTML Script; string
                //     case "html_template": // HTML Template; string
                //     case "icon": // Icon; string
                //     case "image": // Basic Image; string
                //     case "index_name": // Index Name; string
                //     case "int": // Integer String; string
                //     case "integer": // Integer; integer
                //     case "integer_date": // Integer Date; integer
                //     case "integer_time": // Integer Time; integer
                //     case "internal_type": // Internal Type; string
                //     case "ip_addr": // IP Address (Validated IPV4, IPV6); string
                //     case "ip_address": // IP Address; string
                //     case "journal": // Journal; string
                //     case "journal_input": // Journal Input; string
                //     case "journal_list": // Journal List; string
                //     case "json": // JSON; string
                //     case "json_translations": // JSON Translations; string
                //     case "language": // Language; string
                //     case "long": // Long Integer String; string
                //     case "longint": // Long; longint
                //     case "mask_code": // Mask Code; string
                //     case "metric_absolute": // Metric Absolute; float
                //     case "metric_counter": // Metric Counter; float
                //     case "metric_derive": // Metric Derive; float
                //     case "metric_gauge": // Metric Gauge; float
                //     case "mid_config": // MID Server Configuration; string
                //     case "month_of_year": // Month of Year; integer
                //     case "multi_small": // Multiple Line Small Text Area; string
                //     case "multi_two_lines": // Two Line Text Area; string
                //     case "name_values": // Name/Values; string
                //     case "nds_icon": // NDS Icon; string
                //     case "nl_task_int1": // NL Task Integer 1; integer
                //     case "order_index": // Order Index; integer
                //     case "password": // Password (1 Way Encrypted); string
                //     case "password2": // Password (2 Way Encrypted); string
                //     case "percent_complete": // Percent Complete; decimal
                //     case "phone_number": // Phone Number (Unused); string
                //     case "phone_number_e164": // Phone Number (E164); string
                //     case "ph_number": // Phone Number; string
                //     case "price": // Price; decimal
                //     case "properties": // Properties; string
                //     case "radio": // Radio Button Choice; string
                //     case "records": // Records; string
                //     case "record_hierarchy_path": // Record Hierarchy Path; string
                //     case "reference": // Reference; GUID
                //     case "reference_name": // Reference Name; string
                //     case "related_tags": // Related Tags; string
                //     case "reminder_field_name": // Reminder Field Name; string
                //     case "repeat_count": // Repeat Count; integer
                //     case "repeat_type": // Repeat Type; string
                //     case "replication_payload": // Replication Payload; string
                //     case "schedule_date_time": // Schedule Date/Time; string
                //     case "schedule_interval_count": // ; integer
                //     case "script": // Script; string
                //     case "script_client": // Script (Client); string
                //     case "script_plain": // Script (Plain); string
                //     case "script_server": // Script (server side); string
                //     case "short_field_name": // Short Field Name; string
                //     case "short_table_name": // Short Table Name; string
                //     case "simple_name_values": // Name-Value Pairs; string
                //     case "slushbucket": // Slush Bucket; string
                //     case "snapshot_template_value": // Snapshot Template Value; string
                //     case "source_id": // Source ID; GUID
                //     case "source_name": // Source Name; string
                //     case "source_table": // Source Table; string
                //     case "string": // String; string
                //     case "string_boolean": // ; string
                //     case "string_full_utf8": // String (Full UTF-8); string
                //     case "structure": // Structure; string
                //     case "sysevent_name": // System Event Name; string
                //     case "sysrule_field_name": // System Rule Field Name; string
                //     case "sys_class_name": // System Class Name; string
                //     case "sys_class_path": // System Class path; string
                //     case "table_name": // Table Name; string
                //     case "template_value": // Template Value; string
                //     case "time": // Basic Time; time
                //     case "timer": // Timer; datetime
                //     case "translated": // Translated; string
                //     case "translated_field": // Translated Field; string
                //     case "translated_html": // Translated HTML; string
                //     case "translated_text": // Translated Text; string
                //     case "tree_code": // Tree Code; string
                //     case "tree_path": // Tree Path; string
                //     case "url": // URL; string
                //     case "user_image": // Image; string
                //     case "user_input": // User Input; string
                //     case "user_roles": // User Roles; string
                //     case "variables": // Variables; string
                //     case "variable_conditions": // Variable Conditions; string
                //     case "variable_template_value": // Variable template value; string
                //     case "version": // Version; string
                //     case "video": // Video; string
                //     case "week_of_month": // Week of Month; integer
                //     case "wide_text": // Wide Text; string
                //     case "wiki_text": // Wiki; string
                //     case "wms_job": // WMS Job; string
                //     case "workflow": // Workflow; string
                //     case "workflow_conditions": // Workflow Conditions; string
                //     case "xml": // XML; string
                // }
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
                        context.pushDisplayValueListItem(gr.max_length, markdownLines, multiLineStack);
                        break;
                }
                context.pushListItemIfFalse(gr.active, markdownLines);
                context.pushListItemIfTrue(gr.function_field, markdownLines);
                context.pushListItemIfTrue(gr.read_only, markdownLines);
                context.pushListItemIfTrue(gr.mandatory, markdownLines);
                context.pushListItemIfTrue(gr.display, markdownLines);
                context.pushValueListItem(gr.attributes, markdownLines, multiLineStack);
                if (!gs.nil(gr.reference)) {
                    context.pushTableReferenceListItem(gr.reference, markdownLines);
                    context.pushDisplayValueListItem(gr.use_reference_qualifier, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(gr.dynamic_ref_qual, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(gr.reference_key, markdownLines, multiLineStack);
                    context.pushDisplayValueListItem(gr.reference_cascade_rule, markdownLines, multiLineStack);
                    context.pushListItemIfTrue(gr.reference_floats, markdownLines);
                    context.pushListItemIfTrue(gr.dynamic_creation, markdownLines);
                }
                if (!gs.nil(gr.choice) && gr.getValue('choice') != '0')
                    context.pushDisplayValueListItem(gr.choice, markdownLines, multiLineStack);
                context.pushTableReferenceListItem(gr.choice_table, markdownLines);
                context.pushTableReferenceListItem(gr.dependent, markdownLines);
                if (gr.getDisplayValue('use_dependent_field') == 'true') {
                    context.pushListItemIfTrue(gr.use_dependent_field, markdownLines);
                    context.pushFieldReferenceListItem(tableGlideRecord.name, gr.dependent_on_field, markdownLines, name);
                }
                if (gr.getDisplayValue('virtual') == 'true') {
                    context.pushListItemIfTrue(gr.virtual, markdownLines);
                    context.pushCodeListItem(gr.formula, 'javascript', markdownLines, multiLineStack);
                }
                context.pushValueListItem(gr.default_value, markdownLines, multiLineStack);
                context.pushMultiLineItems(multiLineStack, markdownLines);
                markdown += markdownLines.join("\n");
                var aclGr = new GlideRecord('sys_security_acl');
                aclGr.addQuery(name + '.' + element);
                aclGr.query();
                if (aclGr.next()) {
                    markdown += "\n\n**Access Controls:**\n\n| Name | Decision Type | Question | Type | Active |\n| ---- | ------------- | -------- | ---- | ------ |";
                    do {
                        markdown += "\n| Name | Decision Type | Question | Type | Active |";
                    } while (aclGr.next);
                }
                var cGr = new GlideRecord('sys_choice');
                cGr.addQuery('name', name);
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
            }
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