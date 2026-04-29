export type ValueOf<T extends Record<PropertyKey, unknown>> = T[keyof T]

export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never

export type ResultTuple<T, E = Error> = [error: E, data: null] | [error: null, data: T]
