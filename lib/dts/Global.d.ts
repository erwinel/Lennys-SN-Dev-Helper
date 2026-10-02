declare interface IAbstractAjaxProcessor {
    readonly CALLABLE_PREFIX: 'ajaxFunction_';
    
    readonly request?: GlideServletRequest;
    
    readonly responseXML?: XMLDocument2;

    readonly gc?: any; // Packages.com.glide.script.GlideController

    initialize(request?: GlideServletRequest, responseXML?: XMLDocument2, gc?: any): void;
    
    newItem(name?: string): XMLNode;
    
    /**
     * Returns value of a named parameter as a Java String instance
     * @return {(Object | null | undefined)}
     */
    getParameter(name: string): Object | null | undefined;
    
    getDocument(): XMLDocument2 | undefined;
    
    getRootElement(): XMLNode;
    
    /**
     * Returns value of "sysparm_name" as a Java String instance
     * @return {(Object | null | undefined)}
     */
    getName(): Object | null | undefined;
    
    /**
     * Returns value of "sysparm_value" as a Java String instance
     * @return {(Object | null | undefined)}
     */
    getValue(): Object | null | undefined;
    
    /**
     * Returns value of "sysparm_type" as a Java String instance
     * @return {(Object | null | undefined)}
     */
    getType(): Object | null | undefined;
    
    /**
     * Returns value of "sysparm_chars" as a Java String instance
     * @return {(Object | null | undefined)}
     */
    getChars(): string;
    
    setAnswer(value: any): void;
    
    setError(error: any): void;
}