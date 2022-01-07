export declare namespace Recovery {
    type RecoverableClass<C> = {
        recover(obj: Record<string, any>): C;
    };
    type RecoveryFunction = (className: string, arg: Record<string, any>) => any;
    function prepareArgument(arg: any): any;
    function prepareThrownError(error: Error): object;
    function wasThrownError(error: any): boolean;
    function recoverArgument(arg: any, recoveryFunc?: RecoveryFunction): any;
    function recoverThrownError(error: any, recoveryFunc?: RecoveryFunction): Error;
}
