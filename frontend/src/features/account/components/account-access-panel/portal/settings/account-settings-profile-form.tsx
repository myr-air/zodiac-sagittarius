"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AccountSettingsUpdateRequest } from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { SelectOptions } from "@/src/shared/components/select-options";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { accountSettingsLocaleSelectOptions } from "./account-settings-profile-form.model";

interface AccountSettingsProfileFormClassNames {
  settingsForm: string;
  twoCol: string;
}

export function AccountSettingsProfileForm({
  classNames,
  form,
  isSaving,
  labels,
  onSubmit,
  setForm,
}: {
  classNames: AccountSettingsProfileFormClassNames;
  form: AccountSettingsUpdateRequest;
  isSaving: boolean;
  labels: Messages["access"]["settings"]["form"];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setForm: Dispatch<SetStateAction<AccountSettingsUpdateRequest>>;
}) {
  return (
    <form className={classNames.settingsForm} onSubmit={onSubmit}>
      <div className={classNames.twoCol}>
        <label>
          <span>{labels.displayName}</span>
          <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
        </label>
        <label>
          <span>{labels.avatarColor}</span>
          <input
            value={form.avatarColor}
            onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
            className="sr-only"
            id="portal-avatar-color"
            type="color"
            required
          />
          <label
            htmlFor="portal-avatar-color"
            className="inline-block size-[46px] cursor-pointer rounded-(--radius-md) border border-(--color-border-strong) shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)] transition-shadow duration-150 hover:shadow-[0_0_0_4px_rgb(15_118_110_/_0.25)] focus-within:shadow-[0_0_0_4px_rgb(15_118_110_/_0.25)]"
            style={{ backgroundColor: form.avatarColor }}
            title={form.avatarColor}
          />
        </label>
        <label>
          <span>{labels.locale}</span>
          <Select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required>
            <SelectOptions options={accountSettingsLocaleSelectOptions} />
          </Select>
        </label>
        <label>
          <span>{labels.timezone}</span>
          <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
        </label>
        <label>
          <span>Home city</span>
          <input value={form.homeCity ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCity: event.target.value }))} placeholder="Bangkok" />
        </label>
        <label>
          <span>Home country</span>
          <input value={form.homeCountry ?? ""} onChange={(event) => setForm((current) => ({ ...current, homeCountry: event.target.value }))} placeholder="Thailand" />
        </label>
      </div>
      <Button type="submit" disabled={isSaving}>
        <Icon name="check" />
        {labels.save}
      </Button>
    </form>
  );
}
