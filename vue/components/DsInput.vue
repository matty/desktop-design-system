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
    id?: string;
  }>(),
  { type: "text", mono: false, invalid: false, valid: false, disabled: false }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();

const field = inject(dsFieldKey, null);
const resolvedId = computed(() => props.id ?? field?.id.value);
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
    :id="resolvedId"
    :aria-invalid="ariaInvalid"
    :aria-describedby="field?.describedby.value"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
