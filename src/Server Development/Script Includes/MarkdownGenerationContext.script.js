/** @type {MarkdownGenerationContextConstructor} */
var MarkdownGenerationContext = (function () {
    /** @type {MarkdownGenerationContextConstructor} */
    var MarkdownGenerationContextConstructor = Class.create();

    var instanceUri = gs.getProperty('glide.servlet.uri');

    var markdownReservedFullRe = /[\\`*[\]()_]/g;
    var markdownReservedMinimalRe = /[\\`*[\]()]/g;
    var markdownLeadReservedRe = /^[#|-]/;
    var markdownTableReservedFullRe = /[\\`*[\]()|_]/g;
    var markdownTableReservedMinimalRe = /[\\`*[\]()|]/g;
    var newLineRe = /\r\n|\n/g;
    var abnormalWsRe = / \s+|(?! )\s+/g;
    var codeBlockReqRe = /[(?:\r\n|\n)`]/g;
    var headingFragmentConvertRe = /[^\w\s-]+/g;
    var singleSpaceRe = /\s/g;
    var iixExtensionRe = /^(.+?)\.iix$/gi;
    var nameAndxtensionRe = /^(.+?)(\.[^.]*)$/gi;

    /**
     * @param {string} [path]
     * @return {string}
     */
    function getInstanceUrl(path) {
        if (gs.nil(path)) return instanceUri;
        var p = '' + path;
        while (p.startsWith('/') || p.startsWith('\\')) p = p.substring(1);
        return instanceUri + p;
    }

    MarkdownGenerationContextConstructor.getInstanceUrl = getInstanceUrl;
    
    /**
     * @param {string} text
     * @returns {string}
     */
    function encodeHtmlSpecial(text) {
        return text
            .replace('&', '&amp;')
            .replace('>', '&gt;')
            .replace('<', '&lt;');
    }

    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @returns {string}
     */
    function escapeForMarkdown(text, isTableCellContent) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  isTableCellContent
                      ? text.replace(markdownTableReservedFullRe, '\\$&')
                      : text.replace(markdownReservedFullRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.escapeForMarkdown = escapeForMarkdown;

    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @returns {string}
     */
    function minimalEscapeForMarkdown(text, isTableCellContent) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  isTableCellContent
                      ? text.replace(markdownTableReservedMinimalRe, '\\$&')
                      : text.replace(markdownReservedMinimalRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.minimalEscapeForMarkdown =
        minimalEscapeForMarkdown;

    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @returns {string}
     */
    function escapeForTableCellMarkdown(text) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  text.replace(markdownTableReservedFullRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.escapeForTableCellMarkdown =
        escapeForTableCellMarkdown;

    /**
     * @param {string} text
     * @returns {string}
     */
    function minimalEscapeForTableCellMarkdown(text) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  text.replace(markdownTableReservedMinimalRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.minimalEscapeForTableCellMarkdown =
        minimalEscapeForTableCellMarkdown;

    /**
     * @param {string} text
     * @returns {string}
     */
    function escapeForMarkdownStartOfLine(text) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  text
                      .replace(markdownReservedFullRe, '\\$&')
                      .replace(markdownLeadReservedRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.escapeForMarkdownStartOfLine =
        escapeForMarkdownStartOfLine;

    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @returns {string}
     */
    function minimalEscapeForMarkdownStartOfLine(text) {
        return gs.nil(text)
            ? ''
            : encodeHtmlSpecial(
                  text
                      .replace(markdownReservedMinimalRe, '\\$&')
                      .replace(markdownLeadReservedRe, '\\$&')
              );
    }

    MarkdownGenerationContextConstructor.minimalEscapeForMarkdownStartOfLine =
        minimalEscapeForMarkdownStartOfLine;

    /**
     * @param {string} text
     * @returns {string}
     */
    function convertToHeadingFragment(text) {
        return gs.nil(text)
            ? ''
            : text
                  .toLocaleLowerCase()
                  .replace(headingFragmentConvertRe, '')
                  .trim()
                  .replace(singleSpaceRe, '-');
    }

    MarkdownGenerationContextConstructor.convertToHeadingFragment =
        convertToHeadingFragment;

    /**
     * @param {string} text
     * @returns {string}
     */
    function normalizeWhiteSpace(text) {
        return gs.nil(text)
            ? ''
            : ('' + text).replace(abnormalWsRe, ' ').trim();
    }

    MarkdownGenerationContextConstructor.normalizeWhiteSpace =
        normalizeWhiteSpace;

    MarkdownGenerationContextConstructor.prototype = {
        mapper: null,
        _current_folder: '',

        initialize: function () {
            this.mapper = new ReferenceLinkMapper();
        },

        getCurrentFolder: function () {
            return this._current_folder;
        },

        setCurrentFolder: function (folder) {
            this._current_folder = '' + folder;
        },

        getTableReferenceMdLink: function (glideElement, isForTableCell) {
            return this.mapper.getTableMdLink(
                glideElement,
                this._current_folder,
                isForTableCell
            );
        },

        getColumnReferenceMdLink: function (
            tableElement,
            columnElement,
            isForTableCell
        ) {
            return this.mapper.getColumnMdLink(
                tableElement,
                columnElement,
                this._current_folder,
                isForTableCell
            );
        },

        getCatItemReferenceMdLink: function (glideElement, isForTableCell) {
            return this.mapper.getCatItemMdLink(
                glideElement,
                this._current_folder,
                isForTableCell
            );
        },

        getFlowReferenceMdLink: function (glideElement, isForTableCell) {
            return this.mapper.getFlowMdLink(
                glideElement,
                this._current_folder,
                isForTableCell
            );
        },

        getVarSetReferenceMdLink: function (glideElement, isForTableCell) {
            return this.mapper.getVarSetMdLink(
                glideElement,
                this._current_folder,
                isForTableCell
            );
        },

        pushTableReferenceListItem: function (
            glideElement,
            markdownLines,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** ' +
                        this.mapper.getTableMdLink(
                            glideElement.getValue(),
                            this._current_folder
                        )
                );
        },

        pushFieldReferenceListItem: function (
            tableElement,
            fieldElement,
            markdownLines,
            current_table,
            showEmpty
        ) {
            if (gs.nil(fieldElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(fieldElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else if (('' + tableElement) == current_table)
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(fieldElement.getLabel()) +
                        ':** ' +
                        this.mapper.getColumnFragment(
                            tableElement,
                            fieldElement
                        )
                );
            else
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(fieldElement.getLabel()) +
                        ':** ' +
                        this.mapper.getColumnMdLink(
                            tableElement,
                            fieldElement,
                            this._current_folder
                        )
                );
        },

        pushCatItemReferenceListItem: function (
            glideElement,
            markdownLines,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** ' +
                        this.mapper.getCatItemMdLink(
                            glideElement.getValue(),
                            this._current_folder
                        )
                );
        },

        pushFlowReferenceListItem: function (
            glideElement,
            markdownLines,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** ' +
                        this.mapper.getFlowMdLink(
                            glideElement.getValue(),
                            this._current_folder
                        )
                );
        },

        pushVarSetReferenceListItem: function (
            glideElement,
            markdownLines,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** ' +
                        this.mapper.getVarSetMdLink(
                            glideElement.getValue(),
                            this._current_folder
                        )
                );
        },

        pushDisplayValueListItem: function (
            glideElement,
            markdownLines,
            multiLineStack,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else {
                var value = glideElement.getDisplayValue();
                if (newLineRe.test(value))
                    multiLineStack.push({
                        label: glideElement.getLabel(),
                        language: 'text',
                        value: value,
                    });
                else
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** ' +
                            escapeForMarkdown(value)
                    );
            }
        },

        pushValueListItem: function (
            glideElement,
            markdownLines,
            multiLineStack,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else {
                var value = glideElement.getValue();
                if (newLineRe.test(value))
                    multiLineStack.push({
                        label: glideElement.getLabel(),
                        language: 'text',
                        value: value,
                    });
                else
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** ' +
                            minimalEscapeForMarkdown(value)
                    );
            }
        },

        pushClodeBlock: function(glideElement, language, markdownLines, headingLevel) {
            if (gs.nil(glideElement))
                return;
            if (headingLevel && headingLevel > 0) {
                var h = '#';
                for (var i = 1; i < headingLevel; i++)
                    h += '#';
                markdownLines.push(
                    '',
                    h + ' ' + escapeForMarkdown(glideElement.getLabel()),
                    '',
                    '```' + language,
                    glideElement.getValue(),
                    '```'
                );
            } else
                markdownLines.push(
                    '',
                    '**' + escapeForMarkdown(glideElement.getLabel())  + ':**',
                    '',
                    '```' + language,
                    glideElement.getValue(),
                    '```'
                );
        },

        pushCodeBlockListItem: function(glideElement, language, multiLineStack) {
            if (!gs.nil(glideElement))
                multiLineStack.push({
                    label: glideElement.getLabel(),
                    language: language,
                    value: glideElement.getValue(),
                });
        },

        pushCodeListItem: function (
            glideElement,
            language,
            markdownLines,
            multiLineStack,
            showEmpty
        ) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else {
                var value = glideElement.getValue();
                if (newLineRe.test(value))
                    multiLineStack.push({
                        label: glideElement.getLabel(),
                        language: language,
                        value: value,
                    });
                else
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** `' +
                            value +
                            '`'
                    );
            }
        },

        pushBoolean: function (glideElement, markdownLines, showEmpty) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else {
                var value = glideElement.getDisplayValue();
                switch (value) {
                    case 'true':
                        value = 'True';
                        break;
                    case 'false':
                        value = 'False';
                        break;
                    default:
                        value = escapeForMarkdown(value);
                        berak;
                }
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** ' +
                        value
                );
            }
        },

        pushListItemIfTrue: function (glideElement, markdownLines) {
            if (!gs.nil(glideElement)) {
                if (glideElement.getDisplayValue() != 'true')
                    return false;
                markdownLines.push(
                    '- **' +
                        escapeForMarkdown(glideElement.getLabel()) +
                        ':** True'
                );
                return true;
            }
        },

        pushListItemIfFalse: function (glideElement, markdownLines, nilIsFalse) {
            if (!gs.nil(glideElement)) {
                if (glideElement.getDisplayValue() == 'true')
                    return true;
                markdownLines.push('- **' + escapeForMarkdown(glideElement.getLabel()) + ':** False');
                return false;
            }
            if (nilIsFalse)
                markdownLines.push('- **' + escapeForMarkdown(glideElement.getLabel()) + ':** False');
        },

        pushImageListItem: function (glideElement, markdownLines, showEmpty) {
            if (gs.nil(glideElement)) {
                if (showEmpty)
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** *Empty*'
                    );
            } else {
                var attachmentGr = new GlideRecord('sys_attachment');
                if (attachmentGr.get(glideElement.getValue())) {
                    var remoteFileName = glideElement.getDisplayValue();
                    var fileName = gs.nil(attachmentGr.file_name) ? remoteFileName : attachmentGr.getValue('file_name');
                    var content_type = attachmentGr.getValue('content_type');
                    var m, e;
                    switch (content_type) {
                        case 'image/png':
                            m = fileName.match(nameAndxtensionRe);
                            if (m) {
                                if (m[2].toLower() == '.iix')
                                    fileName = m[1] + '.jpg';
                            } else fileName += '.jpg';
                            break;
                        case 'image/jpeg':
                            m = fileName.match(iixExtensionRe);
                            if (m) {
                                if (m[2].toLower() == '.iix')
                                    fileName = m[1] + '.png';
                            } else fileName += '.png';
                            break;
                        case 'image/svg+xml':
                            m = fileName.match(iixExtensionRe);
                            if (m) {
                                if (m[2].toLower() == '.iix')
                                    fileName = m[1] + '.svg';
                            } else fileName += '.svg';
                            break;
                        default:
                            fileName = fileName + '; ' + content_type;
                            break;
                    }
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** ![' +
                            escapeForMarkdown(fileName) +
                            '](' +
                            instanceUri +
                            remoteFileName +
                            ')'
                    );
                } else
                    markdownLines.push(
                        '- **' +
                            escapeForMarkdown(glideElement.getLabel()) +
                            ':** ' +
                            escapeForMarkdown(glideElement.getDisplayValue())
                    );
            }
        },

        pushMultiLineItems: function (multiLineStack, markdownLines) {
            for (var i = 0; i < multiLineStack.length; i++) {
                /** @type {LabeledMultilineStackItem} */
                var mi = multiLineStack[i];
                markdownLines.push(
                    '',
                    '**' + escapeForMarkdown(mi.label) + ':**',
                    '',
                    '```' + mi.language,
                    mi.value,
                    '```'
                );
            }
        },

        type: 'MarkdownGenerationContext',
    };

    return MarkdownGenerationContextConstructor;
})();