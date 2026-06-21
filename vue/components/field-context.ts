import type { InjectionKey, Ref, ComputedRef } from "vue";
export interface DsFieldCtx {
  id: Ref<string>;
  describedby: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
}
export const dsFieldKey: InjectionKey<DsFieldCtx> = Symbol("dsField");
