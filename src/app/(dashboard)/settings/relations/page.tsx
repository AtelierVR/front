'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api/context';
import { getFollowers, updateCurrentUser } from '@/lib/api/users';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { notify } from '@/components/ui/notify';
import { sameValues } from '@/lib/utils';

// ── Quick access ─────────────────────────────────────────────────────────────

const PAGES = [
    { key: 'followers', href: '/settings/relations/followers', icon: 'material-symbols:group-remove-rounded' },
    { key: 'following', href: '/settings/relations/following', icon: 'material-symbols:group-add-rounded' },
    { key: 'friends', href: '/settings/relations/friends', icon: 'material-symbols:diversity-3-rounded' },
    { key: 'pending', href: '/settings/relations/pending', icon: 'material-symbols:pending-actions-rounded' },
] as const;

// ── Follow-request policy (mutually exclusive) ───────────────────────────────
// `auto_accept` is the default and stores no tag.

const POLICY_MODES = ['auto_accept', 'manual_accept', 'auto_reject'] as const;
type PolicyMode = typeof POLICY_MODES[number];

const POLICY_TAGS: Record<PolicyMode, string | null> = {
    auto_accept: null,
    manual_accept: 'usr:manual_follow',
    auto_reject: 'usr:auto_reject_follow',
};

const ALL_POLICY_TAGS = Object.values(POLICY_TAGS).filter((t): t is string => t !== null);

// ── Independent privacy switches ─────────────────────────────────────────────
// Mirrors User.isHideFollowers / isHideFollowing / isDiscoverable in
// node/src/users/user.model.ts (all backed by `usr:*` tags).

interface PrivacyOption {
    /** Tag value, stored as `usr:<tag>`. */
    tag: string;
    /** When true, the switch being ON means the tag is present. */
    positive: boolean;
    title: string;
    description: string;
}

const PRIVACY_OPTIONS: PrivacyOption[] = [
    { tag: 'hide_followers', positive: true, title: 'relations.settings.hide_followers_title', description: 'relations.settings.hide_followers_desc' },
    { tag: 'hide_following', positive: true, title: 'relations.settings.hide_following_title', description: 'relations.settings.hide_following_desc' },
    { tag: 'no_discover', positive: false, title: 'relations.settings.discoverable_title', description: 'relations.settings.discoverable_desc' },
];

export default function RelationsPage() {
    const { t } = useTranslation();
    const { currentUser } = useApi();

    const [tags, setTags] = useState<string[] | undefined>();
    const [saving, setSaving] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const currentUserId = currentUser?.id;

    useEffect(() => {
        setTags(undefined);
    }, [currentUser?.id]);

    // Pending requests are needed to warn before switching to an auto policy.
    useEffect(() => {
        if (currentUserId === undefined) return;
        let cancelled = false;
        getFollowers(currentUserId, 100, 0)
            .then(res => {
                if (!cancelled) setPendingCount(res.items.filter(r => r.type === 'request').length);
            })
            .catch(() => {
                if (!cancelled) setPendingCount(0);
            });
        return () => { cancelled = true; };
    }, [currentUserId]);

    if (!currentUser) return null;

    const originalTags = (currentUser.tags ?? []).filter(tag => tag.startsWith('usr:'));
    const usrTags = tags ?? originalTags;
    const has = (value: string) => usrTags.includes(`usr:${value}`);

    // Save is enabled only while the edited tags actually differ from the stored ones —
    // reverting a change disables it again.
    const dirty = tags !== undefined && !sameValues(usrTags, originalTags);

    const commit = (next: string[]) => setTags(next);

    const setPrivacy = (option: PrivacyOption, checked: boolean) => {
        const tag = `usr:${option.tag}`;
        const shouldHave = option.positive ? checked : !checked;
        commit(shouldHave
            ? [...new Set([...usrTags, tag])]
            : usrTags.filter(existing => existing !== tag));
    };

    const policyMode: PolicyMode = has('manual_follow')
        ? 'manual_accept'
        : has('auto_reject_follow')
            ? 'auto_reject'
            : 'auto_accept';

    const setPolicyMode = (mode: string) => {
        const withoutPolicy = usrTags.filter(existing => !ALL_POLICY_TAGS.includes(existing));
        const tag = POLICY_TAGS[mode as PolicyMode];
        commit(tag ? [...withoutPolicy, tag] : withoutPolicy);
    };

    const save = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await updateCurrentUser({ tags: usrTags });
            setTags(undefined);
            setConfirmOpen(false);
            notify(t('settings.profile.saved'), { type: 'success' });
        } catch (err) {
            notify((err as Error)?.message ?? t('common.error'), { type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        if (!dirty || saving) return;
        // Switching to an auto policy resolves the pending requests — warn first.
        if ((policyMode === 'auto_accept' || policyMode === 'auto_reject') && pendingCount > 0) {
            setConfirmOpen(true);
            return;
        }
        void save();
    };

    return (
        <>
            <PageTitle title={t('relations.title')} />
            <SiteHeader
                subtitle={t('relations.description')}
                after={
                    <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
                        {saving ? (
                            <>
                                <Icon icon="material-symbols:progress-activity" className="size-4 mr-1.5 animate-spin" />
                                {t('settings.profile.saving')}
                            </>
                        ) : (
                            <>
                                <Icon icon="material-symbols:save-rounded" className="size-4 mr-1.5" />
                                {t('settings.profile.save')}
                            </>
                        )}
                    </Button>
                }
            >
                {t('relations.title')}
            </SiteHeader>

            <div className="p-4 md:p-6 space-y-8">
                {/* ── Quick ─────────────────────────────────────────────── */}
                <section className="space-y-2">
                    <h2 className="font-heading text-xl font-semibold">{t('relations.quick_title')}</h2>

                    <Cards>
                        {PAGES.map(page => (
                            <Card
                                key={page.key}
                                href={page.href}
                                icon={<Icon icon={page.icon} aria-hidden />}
                                title={t(`relations.tab_${page.key}`)}
                                description={t(`relations.desc_${page.key}`)}
                            />
                        ))}
                    </Cards>
                </section>

                {/* ── Settings ──────────────────────────────────────────── */}
                <section className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold">{t('relations.settings_title')}</h2>

                    {/* Follow policy */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-base font-semibold">{t('relations.settings.policy_title')}</h3>
                            <Tabs value={policyMode} onValueChange={setPolicyMode}>
                                <TabsList>
                                    {POLICY_MODES.map(mode => (
                                        <TabsTrigger key={mode} value={mode}>
                                            {t(`relations.settings.policy_${mode}`)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t(`relations.settings.policy_${policyMode}_desc`)}
                        </p>
                    </div>

                    {/* Privacy switches */}
                    {PRIVACY_OPTIONS.map(option => (
                        <div key={option.tag} id={option.tag} className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-base font-semibold">{t(option.title)}</h3>
                                <Switch
                                    checked={option.positive ? has(option.tag) : !has(option.tag)}
                                    onCheckedChange={(next) => setPrivacy(option, next)}
                                    disabled={saving}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">{t(option.description)}</p>
                        </div>
                    ))}
                </section>
            </div>

            <ModalDrawer
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                header={t('relations.settings.policy_confirm_title')}
                footer={
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={() => void save()}
                            disabled={saving}
                            variant={policyMode === 'auto_reject' ? 'destructive' : 'default'}
                        >
                            {t('common.confirm')}
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-muted-foreground">
                    {t(`relations.settings.policy_confirm_${policyMode}`, { pending: pendingCount })}
                </p>
            </ModalDrawer>
        </>
    );
}
