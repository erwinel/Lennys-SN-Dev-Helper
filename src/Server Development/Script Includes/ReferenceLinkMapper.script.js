/** @type {ReferenceLinkMapperConstructor} */
var ReferenceLinkMapper = (function() {
    var instanceUri = gs.getProperty('glide.servlet.uri');

    /** @type {ReferenceLinkMapperConstructor} */
    ReferenceLinkMapperConstructor = Class.create();

    var pathSeparatorRe = /[\\/]/;

    /**
     * 
     * @param {string} path 
     * @returns {boolean}
     */
    function isWebLink(path) {
        return path.indexOf(':') > -1 || path.indexOf('#') > -1 || path.indexOf('?') > -1;
    }
    
    ReferenceLinkMapperConstructor.isWebLink = isWebLink;

    /**
     * @param {string} path 
     * @returns {string[]}
     */
    function getPathSegments(path) {
        var pathSegments = path.split(pathSeparatorRe);
        for (var i = pathSegments.length - 1; i > 1; i--) {
            if (pathSegments[i].length == 0)
                pathSegments.splice(i, 1);
        }
        if (pathSegments.length == 2 && pathSegments[1].length == 0 && pathSegments[0].length > 0)
            pathSegments.pop();
        return pathSegments;
    }

    ReferenceLinkMapperConstructor.getPathSegments = getPathSegments;

    /**
     * @param {string} path 
     * @returns {string}
     */
    function normalizePath(path) {
        return getPathSegments(path).join('/');
    }

    ReferenceLinkMapperConstructor.normalizePath = normalizePath;

    /**
     * @param {string} path 
     * @returns {SplitPathComponents}
     */
    function splitPath(path) {
        var segments = getPathSegments(path);
        switch (segments.length) {
            case 1:
                return { leaf: path };
            case 2:
                return (segments[1].length == 0) ? { leaf: '/' } : { parent: (segments[0].length == 0) ? '/' : segments[0], leaf: segments[1] };
            default:
                var leaf = segments.pop();
                return { parent: segments.join('/'), leaf: leaf };
        }
    }

    ReferenceLinkMapperConstructor.splitPath = splitPath;

    /**
     * @param {string} path 
     * @returns {string}
     */
    function getParentPath(path) {
        var segments = getPathSegments(path);
        switch (segments.length) {
            case 1:
                return '';
            case 2:
                var parent = segments[0];
                return (parent.length > 0 || segments[1].length == 0) ? parent : '/';
            default:
                segments.pop();
                return segments.join('/');
        }
    }

    ReferenceLinkMapperConstructor.getParentPath = getParentPath;

    /**
     * @param {string} path 
     * @returns {string[]}
     */
    function getPathLeaf(path) {
        var segments = getPathSegments(path);
        var leaf = segments.pop();
        return (leaf.length > 0 || segments.length != 1) ? leaf : '/';
    }

    ReferenceLinkMapperConstructor.getPathLeaf = getPathLeaf;

    /**
     * @param {string} fileName 
     * @returns {SplitFileNameComponents}
     */
    function splitFileNameAndExtension(fileName) {
        var segments = fileName.split('.');
        if (segments.length == 1)
            return { base_name: fileName };
        var extension = segments.pop();
        return { base_name: segments.join('.'), extension: '.' + extension };
    }
    
    ReferenceLinkMapperConstructor.splitFileNameAndExtension = splitFileNameAndExtension;

    /**
     * @param {string} fileName 
     * @returns {string}
     */
    function getFileBaseName(fileName) {
        var segments = fileName.split('.');
        if (segments.length == 1)
            return fileName;
        segments.pop();
        return segments.join('.');
    }
    
    ReferenceLinkMapperConstructor.getFileBaseName = getFileBaseName;

    /**
     * @param {string} fileName 
     * @returns {string}
     */
    function getFileExtension(fileName) {
        var segments = fileName.split('.');
        return (segments.length > 1) ? '.' + segments.pop() : '';
    }
    
    ReferenceLinkMapperConstructor.getFileExtension = getFileExtension;

    /**
     * @param {string} pathFrom
     * @param {string} pathTo
     * @returns {string}
     */
    function convertToRelativePath(pathFrom, pathTo) {
        if (typeof pathFrom !== 'string')
            pathFrom = '' + pathFrom;
        if (typeof pathTo !== 'string')
            pathTo = '' + pathTo;
        var fromElements = getPathSegments(pathFrom);
        if (fromElements[0].length == 0)
            fromElements.shift();
        var toElements = getPathSegments(pathTo);
        if (toElements[0].length == 0)
            toElements.shift();
        if (fromElements.length == 0) return toElements.join('/');
        if (toElements.length == 0) {
            fromElements.forEach(function (elt, idx, arr) {
                arr[idx] = '..';
            });
            return fromElements.join('/');
        }
        while (fromElements[0] == toElements[0]) {
            fromElements.shift();
            toElements.shift();
            if (fromElements.length == 0) return toElements.join('/');
            if (toElements.length == 0) {
                fromElements.forEach(function (elt, idx, arr) {
                    arr[idx] = '..';
                });
                return fromElements.join('/');
            }
        }
        fromElements.forEach(function (elt, idx, arr) {
            arr[idx] = '..';
        });
        return fromElements.concat(toElements).join('/');
    }

    ReferenceLinkMapperConstructor.convertToRelativePath = convertToRelativePath;

    function getInstanceUri(glideRecord) {
        return instanceUri + 'nav_to.do?uri=' + encodeURIComponent(glideRecord.getLink(true));
    }

    /**
     * @template {MarkdownMapping} T
     * @param {string} sys_id
     * @param {T[]} mappings
     * @returns {(T | undefined)}
     */
    function getMappingBySysId(sys_id, mappings) {
        for (var i = 0; i < mappings.length; i++) {
            var item = mappings[i];
            if (item.sys_id == sys_id)
                return item;
        }
    }

    ReferenceLinkMapperConstructor.prototype = {
        _action_md_mappings: [],
        _cat_item_md_mappings: [],
        _flow_md_mappings: [],
        _table_md_mappings: [],
        _var_set_md_mappings: [],

        initialize: function() {
            var value = gs.getProperty('x_1645769_lte_dhlp.action_md_mappings');
            this._action_md_mappings = value ? JSON.parse(value) : [];
            value = gs.getProperty('x_1645769_lte_dhlp.cat_item_md_mappings');
            this._cat_item_md_mappings = value ? JSON.parse(value) : [];
            value = gs.getProperty('x_1645769_lte_dhlp.flow_md_mappings');
            this._flow_md_mappings = value ? JSON.parse(value) : [];
            value = gs.getProperty('x_1645769_lte_dhlp.table_md_mappings');
            this._table_md_mappings = value ? JSON.parse(value) : [];
            value = gs.getProperty('x_1645769_lte_dhlp.var_set_md_mappings');
            this._var_set_md_mappings = value ? JSON.parse(value) : [];
        },

        getActionMapping: function(action) {
            if (gs.nil(action))
                return;

            /** @type {FlowMarkdownMapping} */
            var item;
            if (action instanceof GlideRecord) {
                item = getMappingBySysId(action.getUniqueValue(), this._action_md_mappings);
                if (!item) {
                    item = {
                        display_name: action.getValue('name'),
                        internal_name: action.getValue('internal_name'),
                        sys_id: action.getValue('sys_id'),
                        file_link: getInstanceUri(action)
                    };
                    this._action_md_mapping.push(item);
                }
                return item;
            }
            var n = '' + action;
            item = getMappingBySysId(n, this._action_md_mappings);
            if (item)
                return item;
            for (var i = 0; i < this._action_md_mappings.length; i++) {
                item = this._action_md_mappings[i];
                if (item.internal_name == action)
                    return item;
            }
            var gr = new GlideRecordSecure('sys_hub_action_type_definition');
            if (!gr.get(n)) {
                gr = new GlideRecordSecure('sys_hub_action_type_definition');
                gr.addQuery('internal_name', n);
                gr.query();
                if (!gr.next())
                    return;
            }
            item = {
                display_name: gr.getValue('name'),
                internal_name: gr.getValue('internal_name'),
                sys_id: gr.getValue('sys_id'),
                file_link: getInstanceUri(gr)
            };
            this._action_md_mappings.push(item);
            return item;
        },

        getCatItemMapping: function(cat_item) {
            if (gs.nil(cat_item))
                return;

            /** @type {MarkdownMapping} */
            var item;
            if (cat_item instanceof GlideRecord) {
                item = getMappingBySysId(cat_item.getUniqueValue(), this._cat_item_md_mappings);
                if (!item) {
                    item = {
                        display_name: cat_item.getValue('name'),
                        sys_id: cat_item.getValue('sys_id'),
                        file_link: getInstanceUri(cat_item)
                    };
                    this._cat_item_md_mappings.push(item);
                }
                return item;
            }
            var n = '' + cat_item;
            item = getMappingBySysId(n, this._cat_item_md_mappings);
            if (item)
                return item;
            var gr = new GlideRecordSecure('sc_cat_item');
            if (!gr.get(n))
                return;
            item = {
                display_name: gr.getValue('name'),
                sys_id: gr.getValue('sys_id'),
                file_link: getInstanceUri(gr)
            };
            this._cat_item_md_mappings.push(item);
            return item;
        },

        getFlowMapping: function(flow) {
            if (gs.nil(flow))
                return;

            /** @type {FlowMarkdownMapping} */
            var item;
            if (flow instanceof GlideRecord) {
                item = getMappingBySysId(flow.getUniqueValue(), this._flow_md_mappings);
                if (!item) {
                    item = {
                        display_name: flow.getValue('name'),
                        internal_name: flow.getValue('internal_name'),
                        sys_id: flow.getValue('sys_id'),
                        file_link: getInstanceUri(flow)
                    };
                    this._flow_md_mappings.push(item);
                }
                return item;
            }
            var n = '' + flow;
            item = getMappingBySysId(n, this._flow_md_mappings);
            if (item)
                return item;
            for (var i = 0; i < this._flow_md_mappings.length; i++) {
                item = this._flow_md_mappings[i];
                if (item.internal_name == n)
                    return item;
            }
            var gr = new GlideRecordSecure('sys_hub_flow');
            if (!gr.get(n)) {
                gr = new GlideRecordSecure('sys_hub_flow');
                gr.addQuery('internal_name', n);
                gr.query();
                if (!gr.next())
                    return;
            }
            item = {
                display_name: gr.getValue('name'),
                internal_name: gr.getValue('internal_name'),
                sys_id: gr.getValue('sys_id'),
                file_link: getInstanceUri(gr)
            };
            this._flow_md_mappings.push(item);
            return item;
        },

        getTableMapping: function(table) {
            if (gs.nil(table))
                return;

            /** @type {TableMarkdownMapping} */
            var item;
            if (table instanceof GlideRecord) {
                item = getMappingBySysId(table.getUniqueValue(), this._table_md_mappings);
                if (!item) {
                    item = {
                        display_name: table.getValue('label'),
                        name: table.getValue('name'),
                        sys_id: table.getValue('sys_id'),
                        file_link: getInstanceUri(table)
                    };
                    this._table_md_mappings.push(item);
                }
                return item;
            }
            var n = '' + table;
            item = getMappingBySysId(n, this._table_md_mappings);
            if (item)
                return item;
            for (var i = 0; i < this._table_md_mappings.length; i++) {
                item = this._table_md_mappings[i];
                if (item.name == n)
                    return item;
            }
            var gr = new GlideRecordSecure('sys_db_object');
            if (!gr.get(n)) {
                gr = new GlideRecordSecure('sys_db_object');
                gr.addQuery('name', n);
                gr.query();
                if (!gr.next())
                    return;
            }
            item = {
                display_name: gr.getValue('label'),
                name: gr.getValue('name'),
                sys_id: gr.getValue('sys_id'),
                file_link: getInstanceUri(gr)
            };
            this._table_md_mappings.push(item);
            return item;
        },

        getVarSetMapping: function(variable_set) {
            if (gs.nil(variable_set))
                return;

            /** @type {VarSetMarkdownMapping} */
            var item;
            if (variable_set instanceof GlideRecord || variable_set instanceof GlideRecordSecure) {
                item = getMappingBySysId(variable_set.getUniqueValue(), this._var_set_md_mappings);
                if (!item) {
                    item = {
                        display_name: variable_set.getValue('title'),
                        internal_name: variable_set.getValue('internal_name'),
                        sys_id: variable_set.getValue('sys_id'),
                        file_link: getInstanceUri(variable_set)
                    };
                    this._var_set_md_mappings.push(item);
                }
                return item;
            }
            var n = '' + variable_set;
            item = getMappingBySysId(n, this._var_set_md_mappings);
            if (item)
                return item;
            for (var i = 0; i < this._var_set_md_mappings.length; i++) {
                item = this._var_set_md_mappings[i];
                if (item.internal_name == n)
                    return item;
            }
            var gr = new GlideRecordSecure('item_option_new_set');
            if (!gr.get(n)) {
                gr = new GlideRecordSecure('item_option_new_set');
                gr.addQuery('internal_name', n);
                gr.query();
                if (!gr.next())
                    return;
            }
            item = {
                display_name: variable_set.getValue('title'),
                internal_name: variable_set.getValue('internal_name'),
                sys_id: gr.getValue('sys_id'),
                file_link: getInstanceUri(gr)
            };
            this._var_set_md_mappings.push(item);
            return item;
        },

        getActionUrl: function(action, current_folder) {
            /** @type {FlowMarkdownMapping} */
            var item = this.getActionMapping(action);
            if (item) {
                if (item.folder) {
                    var relativePath = convertToRelativePath(current_folder, item.folder);
                    if (relativePath != '')
                        return relativePath + '/' + item.file_link;
                }
                return item.file_link;
                // if (!item.folder || current_folder == item.folder)
                //     return item.file_link;
                // return (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link;
            }
        },

        getCatItemUrl: function(cat_item, current_folder) {
            /** @type {MarkdownMapping} */
            var item = this.getCatItemMapping(cat_item);
            if (item) {
                if (item.folder) {
                    var relativePath = convertToRelativePath(current_folder, item.folder);
                    if (relativePath != '')
                        return relativePath + '/' + item.file_link;
                }
                return item.file_link;
                // if (!item.folder || current_folder == item.folder)
                //     return item.file_link;
                // return (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link;
            }
        },

        getFlowUrl: function(flow, current_folder) {
            /** @type {FlowMarkdownMapping} */
            var item = this.getFlowMapping(flow);
            if (item) {
                if (item.folder) {
                    var relativePath = convertToRelativePath(current_folder, item.folder);
                    if (relativePath != '')
                        return relativePath + '/' + item.file_link;
                }
                return item.file_link;
                // if (!item.folder || current_folder == item.folder)
                //     return item.file_link;
                // return (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link;
            }
        },

        getTableUrl: function(table, current_folder) {
            /** @type {TableMarkdownMapping} */
            var item = this.getTableMapping(table);
            if (item) {
                if (item.folder) {
                    var relativePath = convertToRelativePath(current_folder, item.folder);
                    if (relativePath != '')
                        return relativePath + '/' + item.file_link;
                }
                return item.file_link;
                // if (!item.folder || current_folder == item.folder)
                //     return item.file_link;
                // return (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link;
            }
        },

        getVarSetUrl: function(varSet, current_folder) {
            /** @type {VarSetMarkdownMapping} */
            var item = this.getVarSetMapping(varSet);
            if (item) {
                if (item.folder) {
                    var relativePath = convertToRelativePath(current_folder, item.folder);
                    if (relativePath != '')
                        return relativePath + '/' + item.file_link;
                }
                return item.file_link;
                // if (!item.folder || current_folder == item.folder)
                //     return item.file_link;
                // return (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link;
            }
        },

        getActionMdLink: function(action, current_folder, isForTableCell) {
            if (!gs.nil(action)) {
                /** @type {FlowMarkdownMapping} */
                var item = this.getActionMapping(action);
                if (item) {
                    if (item.folder) {
                        var relativePath = convertToRelativePath(current_folder, item.folder);
                        if (relativePath != '')
                            return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + relativePath + '/' + item.file_link + ')';
                    }
                    return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // if (!item.folder || current_folder == item.folder)
                    //     return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link + ')';
                }
                var c = MarkdownGenerationContext.normalizeWhiteSpace(action);
                if (c)
                    return '`' + c + '`';
            }
            return '*Empty*';
        },

        getCatItemMdLink: function(cat_item, current_folder, isForTableCell) {
            if (!gs.nil(cat_item)) {
                /** @type {MarkdownMapping} */
                var item = this.getCatItemMapping(cat_item);
                if (item) {
                    if (item.folder) {
                        var relativePath = convertToRelativePath(current_folder, item.folder);
                        if (relativePath != '')
                            return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + relativePath + '/' + item.file_link + ')';
                    }
                    return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // if (!item.folder || current_folder == item.folder)
                    //     return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link + ')';
                }
                var c = MarkdownGenerationContext.normalizeWhiteSpace(cat_item);
                if (c)
                    return '`' + c + '`';
            }
            return '*Empty*';
        },

        getFlowMdLink: function(flow, current_folder, isForTableCell) {
            if (!gs.nil(flow)) {
                /** @type {FlowMarkdownMapping} */
                var item = this.getFlowMapping(flow);
                if (item) {
                    if (item.folder) {
                        var relativePath = convertToRelativePath(current_folder, item.folder);
                        if (relativePath != '')
                            return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + relativePath + '/' + item.file_link + ')';
                    }
                    return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // if (!item.folder || current_folder == item.folder)
                    //     return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link + ')';
                }
                var c = MarkdownGenerationContext.normalizeWhiteSpace(flow);
                if (c)
                    return '`' + c + '`';
            }
            return '*Empty*';
        },

        getTableMdLink: function(table, current_folder, isForTableCell) {
            if (!gs.nil(table)) {
                /** @type {TableMarkdownMapping} */
                var item = this.getTableMapping(table);
                if (item) {
                    if (item.folder) {
                        var relativePath = convertToRelativePath(current_folder, item.folder);
                        if (relativePath != '')
                            return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + relativePath + '/' + item.file_link + ')';
                    }
                    return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // if (!item.folder || current_folder == item.folder)
                    //     return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link + ')';
                }
                var c = MarkdownGenerationContext.normalizeWhiteSpace(table);
                if (c)
                    return '`' + c + '`';
            }
            return '*Empty*';
        },

        getColumnFragment: function(table, field, isForTableCell) {
            if (gs.nil(table) || gs.nil(field))
                return '*Empty*';
            var column_name = '' + field;
            var table_name = '' + table;
            var columnGr = new GlideRecord('sys_dictionary');
            columnGr.addQuery('name', table_name);
            columnGr.addQuery('element', column_name);
            columnGr.query();
            if (!columnGr.next()) {
                var gth = new GlideTableHierarchy(table_name);
                var tableNames = gth.getTables();
                tableNames.shift();
                var notFound = true;
                while (tableNames.length > 0) {
                    var n = tableNames.shift();
                    columnGr = new GlideRecord('sys_dictionary');
                    columnGr.addQuery('name', n);
                    columnGr.addQuery('element', column_name);
                    columnGr.query();
                    if (columnGr.next()) {
                        table_name = n;
                        notFound = false;
                        break;
                    }
                }
                if (notFound)
                    return '`[' + MarkdownGenerationContext.normalizeWhiteSpace(field) + ']`';
            }
            var column_label = gs.nil(columnGr.column_label) ? column_name : columnGr.getValue('column_label');
            return '[' + MarkdownGenerationContext.escapeForMarkdown(column_label, isForTableCell) + '](#column-' + MarkdownGenerationContext.convertToHeadingFragment(column_label) + ')';
        },

        getColumnMdLink: function(table, field, current_folder, isForTableCell) {
            if (gs.nil(table) || gs.nil(field))
                return '*Empty*';
            var column_name = '' + field;
            var table_name = '' + table;
            var columnGr = new GlideRecord('sys_dictionary');
            columnGr.addQuery('name', table_name);
            columnGr.addQuery('element', column_name);
            columnGr.query();
            if (!columnGr.next()) {
                var gth = new GlideTableHierarchy(table_name);
                var tableNames = gth.getTables();
                tableNames.shift();
                var notFound = true;
                while (tableNames.length > 0) {
                    var n = tableNames.shift();
                    columnGr = new GlideRecord('sys_dictionary');
                    columnGr.addQuery('name', n);
                    columnGr.addQuery('element', column_name);
                    columnGr.query();
                    if (columnGr.next()) {
                        table_name = n;
                        notFound = false;
                        break;
                    }
                }
                if (notFound)
                    return '`[' + MarkdownGenerationContext.normalizeWhiteSpace(table) + '.' + MarkdownGenerationContext.normalizeWhiteSpace(field) + ']`';
            }
            var column_label = gs.nil(columnGr.column_label) ? column_name : columnGr.getValue('column_label');
            /** @type {TableMarkdownMapping} */
            var item = this.getTableMapping(table_name);
            if (!item || !item.folder)
                return '[' + MarkdownGenerationContext.escapeForMarkdown(column_label, isForTableCell) + '](' + MarkdownGenerationContext.getInstanceUrl(columnGr.getLink(true)) + ')';
            var rp = convertToRelativePath(current_folder, item.folder);
            if (rp == '')
                return '[' + MarkdownGenerationContext.escapeForMarkdown(column_label, isForTableCell) + '](' + item.file_link + "#column-" + MarkdownGenerationContext.convertToHeadingFragment(column_label) + ')';
            return '[' + MarkdownGenerationContext.escapeForMarkdown(column_label, isForTableCell) + '](' + rp + '/' + item.file_link + "#column-" + MarkdownGenerationContext.convertToHeadingFragment(column_label) + ')';
        },

        getVarSetMdLink: function(variable_set, current_folder, isForTableCell) {
            if (!gs.nil(variable_set)) {
                /** @type {VarSetMarkdownMapping} */
                var item = this.getVarSetMapping(variable_set);
                if (item) {
                    if (item.folder) {
                        var relativePath = convertToRelativePath(current_folder, item.folder);
                        if (relativePath != '')
                            return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + relativePath + '/' + item.file_link + ')';
                    }
                    return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // if (!item.folder || current_folder == item.folder)
                    //     return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + item.file_link + ')';
                    // return '[' + MarkdownGenerationContext.escapeForMarkdown(item.display_name, isForTableCell) + '](' + (current_folder ? '../' + item.folder : item.folder) + '/' + item.file_link + ')';
                }
                var c = MarkdownGenerationContext.normalizeWhiteSpace(variable_set);
                if (c)
                    return '`[' + c + ']`';
            }
            return '*Empty*';
        },

        type: 'ReferenceLinkMapper'
    };

    return ReferenceLinkMapperConstructor;
})();