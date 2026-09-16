declare type MarkdownTableColumnAlignment = "default" | "left" | "center" | "right";

declare type MarkdownTableCellEscapeOption = "none" | "minimal" | "normal";

declare interface MarkdownTableCellSpec {
    value: string;
    escapingOption?: MarkdownTableCellEscapeOption
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
}

declare interface MarkdownTableHeadingSpec {
    heading: string;
    escapingOption?: MarkdownTableCellEscapeOption
    align?: MarkdownTableColumnAlignment;
    defaultValue?: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
}

declare interface MarkdownTableColumnHeadingSpec<T> {
    /**
     * The key for the column, which is used to retrieve property values of row objects
     *
     * @type {T}
     * @memberof MarkdownTableHeaderSpec
     */
    key: T;

    /**
     * The content of the column heading. If not specified, the heading will be the same as the key.
     *
     * @type {string}
     * @memberof MarkdownTableHeaderSpec
     */
    heading?: string;


    /**
     * The alignment to use for the rendered table column.
     *
     * @type {MarkdownTableColumnAlignment}
     * @memberof MarkdownTableHeaderSpec
     */
    align?: MarkdownTableColumnAlignment;

    /**
     * The default value for cells.
     *
     * @type {string}
     * @memberof MarkdownTableHeaderSpec
     */
    defaultValue?: string;

    bold?: boolean;
    italic?: boolean;
    code?: boolean;
}

declare interface MarkdownTableColumnStringHeadingSpec extends MarkdownTableColumnHeadingSpec<string> {
    /**
     * Indicates how cell content is escaped. Default is 'normal'
     *
     * @type {MarkdownTableCellEscapeOption}
     * @memberof MarkdownTableHeaderSpec
     */
    escapingOption?: MarkdownTableCellEscapeOption;
}

declare type AnyMarkdownTableColumnHeadingSpec = MarkdownTableColumnHeadingSpec<symbol> | MarkdownTableColumnStringHeadingSpec;

declare interface MarkdownTableColumHeadingAccessor {
    getBuilder(): MarkdownTableBuilder;
    getKey(): string | symbol;
    getColumnIndex(): number;
    getHeading(rawValue?: boolean): string;
    setHeading(heading: MarkdownTableHeadingSpec): void;
    setHeading(heading: string, escapingOption?: MarkdownTableCellEscapeOption): void;
    calculateWidth(): number;
    getDefaultValue(): string;
    getEscapingOption(): MarkdownTableCellEscapeOption;
    getAlignment(): MarkdownTableColumnAlignment;
    setAlignment(align: MarkdownTableColumnAlignment): void;
    isBold(): boolean;
    setBold(enabled: boolean): void;
    isItalic(): boolean;
    setItalic(enabled: boolean): void;
    isCode(): boolean;
    setCode(enabled: boolean): void;
}

declare interface MarkdownTableCellAccessor {
    getHeading(): MarkdownTableColumHeadingAccessor;
    getRow(): MarkdownTableRowAccessor;
    getValue(rawValue?: boolean): string;
    getEscapingOption(): MarkdownTableCellEscapeOption;
    setValue(value: MarkdownTableCellSpec): void;
    setValue(value: string, escapingOption?: MarkdownTableCellEscapeOption): void;
    isBold(): boolean;
    setBold(enabled: boolean): void;
    isItalic(): boolean;
    setItalic(enabled: boolean): void;
    isCode(): boolean;
    setCode(enabled: boolean): void;
    calculateMinWidth(): number;
}

declare interface MarkdownTableRowAccessor {
    getBuilder(): MarkdownTableBuilder;
    getRowIndex(): number;
    getCells(): Iterator<MarkdownTableCellAccessor>;
    getCell(key: string | symbol): MarkdownTableCellAccessor | undefined;
    getCellAt(index: number): MarkdownTableColumHeadingAccessor | undefined;
    getCellValue(key: string | symbol, rawValue?: boolean): string | undefined;
    getCellValueAt(index: number, rawValue?: boolean): string | undefined;
    setCellValue(key: string | symbol, value: MarkdownTableCellSpec): MarkdownTableCellAccessor;
    setCellValue(key: string | symbol, value: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableCellAccessor;
    setCellValueAt(index: number, value: MarkdownTableCellSpec): MarkdownTableCellAccessor;
    setCellValueAt(index: number, value: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableCellAccessor;
}

declare interface RowPredicateCallback { (row: MarkdownTableRowAccessor): boolean; }
declare interface RowPredicateCallbackThis<T> { (this: T, row: MarkdownTableRowAccessor): boolean; }

declare interface MarkdownTableBuilder {
    getColumnCount(): number;
    indexOf(key: string | symbol): number;
    getHeadings(): Iterator<MarkdownTableColumHeadingAccessor>;
    getHeading(key: string | symbol): MarkdownTableColumHeadingAccessor | undefined;
    getHeadingAt(index: number): MarkdownTableColumHeadingAccessor | undefined;
    addColumn(headingSpecs: AnyMarkdownTableColumnHeadingSpec): MarkdownTableColumHeadingAccessor;
    addColumn(key: string, escapingOption: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    addColumn(key: string, headingText?: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    addColumn(key: symbol, headingText: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    insertColumn(index: number, headingSpecs: AnyMarkdownTableColumnHeadingSpec): MarkdownTableColumHeadingAccessor;
    insertColumn(index: number, key: string, escapingOption: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    insertColumn(index: number, key: string, headingText?: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    insertColumn(index: number, key: symbol, headingText: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    setHeading(key: string | symbol, headingText: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    setHeadingAt(index: number, headingText: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
    removeColumn(key: string | symbol): boolean;
    removeColumnAt(index: number): string | symbol | undefined;
    getRowCount(): number;
    getRows(): Iterator<MarkdownTableRowAccessor>;
    getCell(rowIndex: number, key: string | symbol): MarkdownTableCellAccessor | undefined;
    getCellAt(rowIndex: number, columnIndex: number): MarkdownTableColumHeadingAccessor | undefined;
    getCellValue(rowIndex: number, key: string | symbol, rawValue?: boolean): string | undefined;
    getCellValueAt(rowIndex: number, columnIndex: number, rawValue?: boolean): string | undefined;
    setCellValue(rowIndex: number, key: string | symbol, value: MarkdownTableCellSpec): MarkdownTableCellAccessor;
    setCellValue(rowIndex: number, key: string | symbol, value: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableCellAccessor;
    setCellValueAt(rowIndex: number, columnIndex: number, value: MarkdownTableCellSpec): MarkdownTableCellAccessor;
    setCellValueAt(rowIndex: number, columnIndex: number, value: string, escapingOption?: MarkdownTableCellEscapeOption): MarkdownTableCellAccessor;
    getRowAt(index: number): MarkdownTableRowAccessor | undefined;
    getAutoAddColumnsOnNewRow(): boolean;
    setAutoAddColumnsOnNewRow(enabled: boolean): void;
    addRow(source?: Record<string | symbol, any>): MarkdownTableRowAccessor;
    addRowFromSpecs(source?: Record<string | symbol, MarkdownTableCellSpec>): MarkdownTableRowAccessor;
    insertRow(index: number, source?: Record<string | symbol, any>): MarkdownTableRowAccessor;
    insertRowFromSpecs(index: number, source?: Record<string | symbol, MarkdownTableCellSpec>): MarkdownTableRowAccessor;
    removeRow(index: number): void;
    removeRows(predicate: (row: MarkdownTableRowAccessor) => boolean): number;
    removeRows<T>(predicate: (this: T, row: MarkdownTableRowAccessor, thisObj: T) => boolean): number;
    removeRows(startIndex?: number, length?: number): void;
    clearRows(): void;
    sort(compareFn: (a: MarkdownTableRowAccessor, b: MarkdownTableRowAccessor) => number): void;
    sort<T>(compareFn: (this: T, a: MarkdownTableRowAccessor, b: MarkdownTableRowAccessor) => number, thisObj: T): void;
    getMarkdown(): string;
}
declare interface MarkdownTableBuilderContructor {
    new(headers: (string | AnyMarkdownTableColumnHeadingSpec)[]): MarkdownTableBuilder;
    new(...headers: (string | AnyMarkdownTableColumnHeadingSpec)[]): MarkdownTableBuilder;
}

// type TableColumnHeadingPrototype = MarkdownTableColumHeadingAccessor & {
//     _widestCell?: MarkdownTableCellAccessor;
//     _builder: MarkdownTableBuilder;
//     _key: string | symbol;
//     _escapedHeading: string;
//     _rawHeading: string;
//     _align: MarkdownTableColumnAlignment;
//     _escapingOption: MarkdownTableCellEscapeOption;
//     _index: number;
//     _defaultValue: string;
//     _bold: boolean;
//     _italic: boolean;
//     _code: boolean;
//     _resetWidestCell(): void;
//     _calculateMinWidth(): number;
// };

// type MarkdownTableCellAccessorPrototype = MarkdownTableCellAccessor & {
//     _row: MarkdownTableRowAccessor;
//     _heading: MarkdownTableColumHeadingAccessor;
//     _escapedValue: string;
//     _rawValue: string;
//     _escapingOption: MarkdownTableCellEscapeOption;
//     _bold: boolean;
//     _italic: boolean;
//     _code: boolean;
// }

// type MarkdownTableRowAccessorPrototype = MarkdownTableRowAccessor & {
//     _builder: MarkdownTableBuilder;
//     _index: number;
//     _valueMap: { [key: string | symbol]: MarkdownTableCellAccessor; };
//     _valueArray: MarkdownTableCellAccessor[];
// }

// type MarkdownTableBuilder = MarkdownTableBuilder & {
//     _autoAddColumnsOnNewRow: boolean;
//     _headingArray: MarkdownTableColumHeadingAccessor[];
//     _headingMap: { [key: string]: MarkdownTableColumHeadingAccessor; };
//     _rows: MarkdownTableRowAccessor[];
//     _createColumn(index: number, key: string | symbol, headingText: string, escapingOption: MarkdownTableCellEscapeOption): MarkdownTableColumHeadingAccessor;
// }
