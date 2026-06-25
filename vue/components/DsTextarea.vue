<script setup lang="ts">
import { computed, inject } from "vue";
import { dsFieldKey } from "./field-context";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    invalid?: boolean;
    valid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
    placeholder?: string;
    id?: string;
    name?: string;
  }>(),
  { invalid: false, valid: false, disabled: false, readonly: false, rows: 3 }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();
const field = inject(dsFieldKey, null);
const resolvedId = computed(() => field?.id.value ?? props.id);
const classes = computed(() => ({ "is-invalid": props.invalid || field?.invalid.value, "is-valid": props.valid }));
</script>

<template>
  <textarea
    class="ds-textarea"
    :class="classes"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled || undefined"
    :readonly="readonly || undefined"
    :id="resolvedId"
    :name="name"
    :aria-invalid="props.invalid || field?.invalid.value || undefined"
    :aria-describedby="field?.describedby.value"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  ></textarea>
</template>
