import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosError,
    CancelTokenSource,
} from "axios";

const axiosParams = {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
};

const axiosInstance: AxiosInstance = axios.create(axiosParams);

export const didAbort = (error: unknown): { aborted: boolean } | undefined =>
    axios.isCancel(error) ? { aborted: true } : undefined;

const getCancelSource = (): CancelTokenSource => axios.CancelToken.source();

export const isApiError = (error: unknown): error is AxiosError =>
    axios.isAxiosError(error);

interface ConfigWithAbort extends AxiosRequestConfig {
    abort?: (cancel: (message?: string) => void) => void;
}

type ApiResponse<T = unknown> = Promise<T>;

const withAbort = <T = unknown>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => Promise<any>
) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (...args: any[]): ApiResponse<T> => {
        const lastArg = args[args.length - 1];
        const isConfigObject = lastArg && typeof lastArg === 'object' &&
            ('abort' in lastArg || 'headers' in lastArg || 'params' in lastArg || Object.keys(lastArg).length === 0);

        let config: ConfigWithAbort = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let callArgs: any[] = args;

        if (isConfigObject || args.length === 1) {
            config = (lastArg as ConfigWithAbort) || {};
            callArgs = args.slice(0, -1);
        }

        const { abort, ...axiosConfig } = config;

        if (typeof abort === "function") {
            const { cancel, token } = getCancelSource();
            axiosConfig.cancelToken = token;
            abort(cancel);
        }

        try {
            const response = await fn(...callArgs, axiosConfig);
            return response.data;
        } catch (error) {
            console.log("api error", error);

            if (didAbort(error) && typeof error === 'object' && error !== null) {
                (error as { aborted?: boolean }).aborted = true;
            }

            throw error;
        }
    };
};

interface ApiClient {
    get: <T = unknown>(url: string, config?: ConfigWithAbort) => ApiResponse<T>;
    delete: <T = unknown>(url: string, config?: ConfigWithAbort) => ApiResponse<T>;
    post: <T = unknown>(
        url: string,
        body?: unknown,
        config?: ConfigWithAbort
    ) => ApiResponse<T>;
    patch: <T = unknown>(
        url: string,
        body?: unknown,
        config?: ConfigWithAbort
    ) => ApiResponse<T>;
    put: <T = unknown>(
        url: string,
        body?: unknown,
        config?: ConfigWithAbort
    ) => ApiResponse<T>;
}

const api = (axios: AxiosInstance): ApiClient => {
    return {
        get: <T = unknown>(url: string, config: ConfigWithAbort = {}) =>
            withAbort<T>(axios.get)(url, config),
        delete: <T = unknown>(url: string, config: ConfigWithAbort = {}) =>
            withAbort<T>(axios.delete)(url, config),
        post: <T = unknown>(
            url: string,
            body?: unknown,
            config: ConfigWithAbort = {}
        ) => withAbort<T>(axios.post)(url, body, config),
        patch: <T = unknown>(
            url: string,
            body?: unknown,
            config: ConfigWithAbort = {}
        ) => withAbort<T>(axios.patch)(url, body, config),
        put: <T = unknown>(url: string, body?: unknown, config: ConfigWithAbort = {}) =>
            withAbort<T>(axios.put)(url, body, config),
    };
};

export default api(axiosInstance);
