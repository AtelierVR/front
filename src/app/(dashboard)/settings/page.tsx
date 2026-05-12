'use client';

import { NotFound } from "@/app/(dashboard)/not-found";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
    const { t } = useTranslation();
    return <NotFound
        children={t('settings.title')}
    />;
}