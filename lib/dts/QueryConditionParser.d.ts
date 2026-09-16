declare type QueryOperator = "!=" | "<" | "<=" | "=" | ">" | ">=" | "ANYTHING" | "BETWEEN" | "CHANGESFROM" | "CHANGESTO" | "CONTAINS" | "DATEPART" | "DOES NOT CONTAIN" | "DOESNOTHAVE" | "DYNAMIC" | "EMPTY" | "EMPTYSTRING" | "ENDSWITH" | "EXCLUDING" | "GT_FIELD" | "GT_OR_EQUALS_FIELD" | "IN" | "IN_HIERARCHY" | "IN_HIERARCHY_DYNAMIC" | "INSTANCEOF" | "ISEMPTY" | "ISNOTEMPTY" | "LESSTHAN" | "LIKE" | "LT_FIELD" | "LT_OR_EQUALS_FIELD" | "MORETHAN" | "NOT IN" | "NOT LIKE" | "NOTEMPTY" | "NOTON" | "NSAMEAS" | "ON" | "RELATIVELT" | "RELATIVEGT" | "SAMEAS" | "STARTSWITH" | "VALCHANGES";
declare type QueryOperatorType = "value" | "multi-value" | "field" | "unary" | "range" | "date" | "dynamic";

declare interface QueryConditionOption {
    getName(index?: number): string;
    getOperator(): QueryOperator;
    getType(): QueryOperatorType;
    getValueCount(): number;
    getValue(index?: number): string | null;
    getDisplayValue(fieldReplace?: string, valueReplace?: string): string;
}

declare interface QueryCondition {
    getCount(): number;
    get(index: number): QueryConditionOption | undefined;
    add(name: string, operator: QueryOperator, value?: string | null): void;
    getAll(): Iterator<QueryConditionOption>;
    toArray(): QueryConditionOption[];
    forEach(callbackfn: { (item: QueryConditionOption, index: number): void; }): void;
    forEach<T>(callbackfn: { (this: T, item: QueryConditionOption, index: number): void; }, thisArg: T): void;
    map<T>(callbackfn: { (item: QueryConditionOption, index: number): T; }): T[];
    map<T, U>(callbackfn: { (this: U, item: QueryConditionOption, index: number): T; }, thisArg: U): T[];
}

declare interface ConditionSet {
    getCount(): number;
    get(index: number): QueryCondition | undefined;
    add(condition: QueryCondition): void;
    getAll(): Iterator<QueryCondition>;
    toArray(): QueryCondition[];
    forEach(callbackfn: { (item: QueryCondition, index: number): void; }): void;
    forEach<T>(callbackfn: { (this: T, item: QueryCondition, index: number): void; }, thisArg: T): void;
    map<T>(callbackfn: { (item: QueryCondition, index: number): T; }): T[];
    map<T, U>(callbackfn: { (this: U, item: QueryCondition, index: number): T; }, thisArg: U): T[];
}

declare interface ConditionSetContext {
    currentSet: ConditionSet;
    setIndex: number;
    currentLine: string;
    emittedLines: string[];
}

declare interface QueryConditionContext extends ConditionSetContext {
    currentQuery: QueryCondition;
    queryIndex: number;
}

declare interface ConditionOptionContext extends QueryConditionContext {
    currentQueryOption: QueryCondition;
    optionIndex: number;
}

declare interface QueryConditionParser {
    queryConditionAndOperatorText: string;
    queryConditionOrOperatorText: string;
    conditionSetOrOperatorText: string;
    comparisonOperatorMap: Record<QueryOperator, string>;
    beforeEmitConditionSet?: { (context: ConditionSetContext): void; }
    beforeEmitQueryCondition?: { (context: QueryConditionContext): void; }
    beforeEmitQueryConditionOption?: { (context: ConditionOptionContext): void; }
    afterEmitQueryConditionOption?: { (context: ConditionOptionContext): void; }
    afterEmitQueryCondition?: { (context: QueryConditionContext): void; }
    afterEmitConditionSet?: { (context: ConditionSetContext): void; }
    fieldEncode?: { (context: ConditionOptionContext): string; }
    comparisonOperatorEncode?: { (display_text: string, context: ConditionOptionContext): string; }
    valueEncode?: { (context: ConditionOptionContext): string; }
    getCount(): number;
    get(index: number): ConditionSet | undefined;
    add(condition: ConditionSet): void;
    getAll(): Iterator<ConditionSet>;
    toArray(): ConditionSet[];
    forEach(callbackfn: { (item: ConditionSet, index: number): void; }): void;
    forEach<T>(callbackfn: { (this: T, item: ConditionSet, index: number): void; }, thisArg: T): void;
    map<T>(callbackfn: { (item: ConditionSet, index: number): T; }): T[];
    map<T, U>(callbackfn: { (this: U, item: ConditionSet, index: number): T; }, thisArg: U): T[];
    toStringArray(): string[];
}

declare interface QueryConditionParserConstructor {
    /**
     * @param {string} queryString - The query string to parse
     */
    new(queryString: string): QueryConditionParser;

    getOperatorDislayText(operator: QueryOperator): string;

    QueryCondition: { new(name: string, operator: QueryOperator, value?: string | null):QueryCondition; }

    ConditionSet: { new(condition: QueryCondition):QueryCondition; }
}
