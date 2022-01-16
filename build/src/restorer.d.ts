export declare namespace Restorer {
    type RestorableClass<C> = {
        restoreClass(obj: Record<string, any>): C;
    };
    type RestorerFunction = (className: string, arg: Record<string, any>) => any;
    function prepareArgument(arg: any): any;
    function prepareThrownError(error: Error): object;
    function wasThrownError(error: any): boolean;
    function restoreArgument(arg: any, restorer?: RestorerFunction): any;
    function restoreThrownError(error: any, restorer?: RestorerFunction): Error;
}
