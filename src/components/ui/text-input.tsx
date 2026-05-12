'use client';

import { cn } from '@/lib/utils';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /**
     * RegExp tested against the full value on every keystroke.
     * If the new value doesn't match, the change is rejected.
     * Example: /^[a-z0-9_-]*$/ to allow only slug characters.
     */
    pattern?: RegExp;
    /**
     * Maximum number of characters allowed. Shows a live counter.
     * Input is blocked once the limit is reached.
     */
    maxLength?: number;
    /**
     * Minimum number of characters expected.
     * The counter turns destructive when below this threshold.
     */
    minLength?: number;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    type?: 'text' | 'email' | 'url' | 'search' | 'tel' | 'password';
}

export function TextInput({
    value,
    onChange,
    placeholder,
    pattern,
    maxLength,
    minLength,
    className,
    disabled,
    id,
    name,
    type = 'text',
}: TextInputProps) {
    const showCounter = maxLength != null || minLength != null;
    const length = value.length;

    // Counter is "bad" when below minLength or at/above maxLength
    const counterBad =
        (minLength != null && length < minLength) ||
        (maxLength != null && length > maxLength);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;

        // Enforce maxLength
        if (maxLength != null && next.length > maxLength) return;

        // Enforce pattern
        if (pattern != null && next !== '' && !pattern.test(next)) return;

        onChange(next);
    };

    const counterLabel = maxLength != null
        ? `${length}/${maxLength}`
        : minLength != null
            ? `${length} / ≥${minLength}`
            : `${length}`;

    return (
        <InputGroup className={className}>
            <InputGroupInput
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
            />
            {showCounter && (
                <InputGroupAddon align="inline-end">
                    <InputGroupText
                        className={cn(
                            'text-xs tabular-nums transition-colors',
                            counterBad ? 'text-destructive' : 'text-muted-foreground',
                        )}
                    >
                        {counterLabel}
                    </InputGroupText>
                </InputGroupAddon>
            )}
        </InputGroup>
    );
}
