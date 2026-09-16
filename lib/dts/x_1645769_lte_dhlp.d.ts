declare type SnLogicalQueryOperator = "^NQ" | "^OR" | "^";

declare type SnComparisonQueryOperator = "=" | "!=" | "<" | ">" | "<=" | ">=" | "LIKE" | "NOT LIKE" | "STARTSWITH" | "ENDSWITH" | "INSTANCEOF" | "BETWEEN" | "SAMEAS" | "NSAMEAS" | "ISEMPTY" | "ISNOTEMPTY" | "ANYTHING" | "EMPTYSTRING" | "IN" | "NOT IN"

declare interface SnQueryComparisonToken {
    lValue: string;
    operator?: SnComparisonQueryOperator;
    rValue?: string | string[]
}

declare type SnQueryExpressionToken = SnQueryComparisonToken | SnLogicalQueryOperator;

declare interface MarkdownLink {
    display_text: string;
    url: string;
}

declare type MarkdownLinkMap  = { [key: string]: MarkdownLink };

declare interface LTEDevHelperConstructor {
    /**
     * @param {string} text
     * @param {boolean} [isTableCellContent]
     * @return {string}
     */
    escapeForMarkdown(text: string, isTableCellContent?: boolean): string;

    /**
     * @param {string} queryString
     * @return {SnQueryExpressionToken[]}
     */
    tokenizeQueryString(queryString: string): SnQueryExpressionToken[];

    /**
     * @param {(GlideRecordSecure | string)} target - sc_cat_item
     * @param {MarkdownLinkMap} referenceMap
     * @return {string}
     */
    getCatalogItemMarkdown(target: GlideRecordSecure | string, referenceMap: MarkdownLinkMap): string;

    /**
     * @param {(GlideRecordSecure | string)} target - item_option_new_set
     * @param {MarkdownLinkMap} referenceMap
     * @return {string}
     */
    getVariableSetMarkdown(target: GlideRecordSecure | string, referenceMap: MarkdownLinkMap): string;
}

declare var LTEDevHelper: LTEDevHelperConstructor;

declare interface MarkdownGenerationContextConstructor {
    /**
     * @param {string} [path]
     * @return {string}
     */
    getInstanceUrl(path?: string): string;

    escapeForMarkdown(text: string, isTableCellContent?: boolean): string;

    minimalEscapeForMarkdown(text: string, isTableCellContent?: boolean): string;

    escapeForTableCellMarkdown(text: string): string;

    escapeForTableCellMarkdown(text: string): string;

    minimalEscapeForTableCellMarkdown(text: string): string;

    escapeForMarkdownStartOfLine(text: string): string;

    minimalEscapeForMarkdownStartOfLine(text: string): string;

    convertToHeadingFragment(text: string): string;

    normalizeWhiteSpace(text: string): string;

    new(): MarkdownGenerationContext;

    prototype: MarkdownGenerationContext;
}

declare interface LabeledMultilineStackItem {
    label: string;
    language: string;
    value: string;
}

declare interface MarkdownGenerationContext {
    getCurrentFolder(): string;
    setCurrentFolder(folder: string): void;
    getTableReferenceMdLink(glideElement: GlideRecord | GlideRecordSecure | GlideElement | string, isForTableCell?: boolean): string;
    getColumnReferenceMdLink(glideElement: GlideRecord | GlideRecordSecure | GlideElement | string, columnElement: GlideElement | string, isForTableCell?: boolean): string;
    getCatItemReferenceMdLink(glideElement: GlideRecord | GlideRecordSecure | GlideElement | string, isForTableCell?: boolean): string;
    getFlowReferenceMdLink(glideElement: GlideRecord | GlideRecordSecure | GlideElement | string, isForTableCell?: boolean): string;
    getVarSetReferenceMdLink(glideElement: GlideRecord | GlideRecordSecure | GlideElement | string, isForTableCell?: boolean): string;
    pushTableReferenceListItem(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushFieldReferenceListItem(glideElement: GlideElement, fieldElement: GlideElement, markdownLines: string[], currentTable: string | GlideElement, showEmpty?: boolean): void;
    pushCatItemReferenceListItem(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushFlowReferenceListItem(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushVarSetReferenceListItem(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushDisplayValueListItem(glideElement: GlideElement, markdownLines: string[], multiLineStack: LabeledMultilineStackItem[], showEmpty?: boolean): void;
    pushValueListItem(glideElement: GlideElement, markdownLines: string[], multiLineStack: LabeledMultilineStackItem[], showEmpty?: boolean): void;
    pushClodeBlock(glideElement: GlideElement, language: string, markdownLines: string[], headingLevel?: number): void;
    pushCodeBlockListItem(glideElement: GlideElement, language: string, multiLineStack: LabeledMultilineStackItem[]): void;
    pushCodeListItem(glideElement: GlideElement, language: string, markdownLines: string[], multiLineStack: LabeledMultilineStackItem[], showEmpty?: boolean): void;
    pushBoolean(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushListItemIfTrue(glideElement: GlideElement, markdownLines: string[]): void;
    pushListItemIfFalse(glideElement: GlideElement, markdownLines: string[]): void;
    pushImageListItem(glideElement: GlideElement, markdownLines: string[], showEmpty?: boolean): void;
    pushMultiLineItems(multiLineStack: LabeledMultilineStackItem[], markdownLines: string[]): void;

    type: "MarkdownGenerationContext";
}

declare var MarkdownGenerationContext: MarkdownGenerationContextConstructor;

declare interface TableMarkdownGeneratorConstructor {
    /**
     * @param {(GlideRecord | GlideRecordSecure)} tableGlideRecord - sys_db_object
     * @param {MarkdownGenerationContext} context
     * @return {string}
     */
    getTableMarkdown(tableGlideRecord: GlideRecord | GlideRecordSecure, context: MarkdownGenerationContext): string;
}

declare var TableMarkdownGenerator: TableMarkdownGeneratorConstructor;

declare interface ValueAndDisplay<T> {
    value: T;
    display_value: string;
}

declare interface VariableFindResult {
    variable: QuestionItem;
    variable_set?: QuestionItem;
}

declare interface VariableMapConstructor {
    decodeConditionString(conditionString: string, context: MarkdownGenerationContext): string;
    new(parentItem: GlideRecord | GlideRecordSecure | GlideElement | string): VariableMap;
}

declare interface VariableMap {
    getParentSysID(): string;
    getParentDisplayValue(): string;
    getParentTableName(): string;
    getParentClassName(): string;
    parentIsVariableSet(): boolean;
    parentIsRecordProducer(): boolean;
    getAllVariables(): QuestionItem[];
    findVariableBySysId(sys_id: string): VariableFindResult | undefined;
    getVariableBySysId(sys_id: string): QuestionItem | undefined;
    getNestedVariableBySysId(sys_id: string): QuestionItem | undefined;
    findVariableByName(varName: string): VariableFindResult | undefined;
    getVariableByName(varName: string): QuestionItem | undefined;
    getNestedVariableByName(varName: string): QuestionItem | undefined;
    pushVariablesSectionMarkdown(context: MarkdownGenerationContext, markdownLines: string[]): void;
    
    type: "VariableMap";
}

declare var VariableMap: VariableMapConstructor;

declare interface QuestionItem {
    sys_id: string;
    name: string;
    type_value: number;
    type_label: string;
    question_text: string;
    set_map?: VariableMap;
    order: ValueAndDisplay<number>;
    field?: ValueAndDisplay<string>;
    parent_sys_id: string;
    parent_type: "catalog_item" | "variable_set";
}

declare interface MarkdownMapping {
    display_name: string;
    sys_id: string;
    folder?: string;
    file_link: string;
}

declare type FlowMarkdownMapping = MarkdownMapping & {
    internal_name: string;
}

declare type TableMarkdownMapping = MarkdownMapping & {
    name: string;
}

declare type VarSetMarkdownMapping = MarkdownMapping & {
    internal_name: string;
}

declare interface MarkdownEscapeOptions {
    table_cell_content?: boolean;
    start_of_line?: boolean;
}

declare interface ReferenceLinkMapperConstructor {
    new(): ReferenceLinkMapper;
}

declare interface ReferenceLinkMapper {
    getActionMapping(action: GlideRecord | GlideRecordSecure | GlideElement | string): FlowMarkdownMapping | undefined;
    getCatItemMapping(cat_item: GlideRecord | GlideRecordSecure | GlideElement | string): MarkdownMapping | undefined;
    getFlowMapping(flow: GlideRecord | GlideRecordSecure | GlideElement | string): FlowMarkdownMapping | undefined;
    getTableMapping(table: GlideRecord | GlideRecordSecure | GlideElement | string): TableMarkdownMapping | undefined;
    getVarSetMapping(varSet: GlideRecord | GlideRecordSecure | GlideElement | string): VarSetMarkdownMapping | undefined;
    getActionUrl(action: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string): string | undefined;
    getCatItemUrl(cat_item: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string): string | undefined;
    getFlowUrl(flow: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string): string | undefined;
    getTableUrl(table: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string): string | undefined;
    getVarSetUrl(varSet: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string): string | undefined;
    getActionMdLink(action: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;
    getCatItemMdLink(cat_item: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;
    getFlowMdLink(flow: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;
    getTableMdLink(table: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;
    getColumnMdLink(table: GlideRecord | GlideRecordSecure | GlideElement | string, field: GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;
    getVarSetMdLink(variable_set: GlideRecord | GlideRecordSecure | GlideElement | string, current_folder?: string, isForTableCell?: boolean): string | undefined;

    type: 'ReferenceLinkMapper';
}

declare var ReferenceLinkMapper: ReferenceLinkMapperConstructor;

declare interface ServiceCatalogMarkdownGenerator {
    type: 'ServiceCatalogMarkdownGenerator';
}

declare interface ServiceCatalogMarkdownGeneratorConstructor {
    new(): ServiceCatalogMarkdownGenerator;
}

declare var ServiceCatalogMarkdownGenerator: ServiceCatalogMarkdownGeneratorConstructor;