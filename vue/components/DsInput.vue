<script setup lang="ts">
import { computed, inject } from "vue";
import { dsFieldKey } from "./field-context";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    type?: string;
    placeholder?: string;
    mono?: boolean;
    invalid?: boolean;
    valid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    id?: string;
    name?: string;
  }>(),
  { type: "text", mono: false, invalid: false, valid: false, disabled: false, readonly: false }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();

const field = inject(dsFieldKey, null);
// Field-id-wins: inside a DsField the field id is authoritative so the
// field's <label for> always matches; the consumer id is only used standalone.
const resolvedId = computed(() => field?.id.value ?? props.id);
const ariaInvalid = computed(() => props.invalid || field?.invalid.value || undefined);
const classes = computed(() => ({
  "is-mono": props.mono,
  "is-invalid": props.invalid || field?.invalid.value,
  "is-valid": props.valid
}));
</script>

<template>
  <input
    class="ds-input"
    :class="classes"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled || undefined"
    :readonly="readonly || undefined"
    :id="resolvedId"
    :name="name"
    :aria-invalid="ariaInvalid"
    :aria-describedby="field?.describedby.value"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
