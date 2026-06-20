import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { StopDialogAdvancedFields } from "./StopDialogAdvancedFields";
import { StopDialogContextFields } from "./StopDialogContextFields";
import { StopDialogDetailSection } from "./StopDialogDetailSection";
import { StopDialogPlaceResolution } from "./StopDialogPlaceResolution";
import { StopDialogPrimaryFields } from "./StopDialogPrimaryFields";
import { StopDialogTimeWindow } from "./StopDialogTimeWindow";
import { dialogErrorClassName, dialogGridClassName } from "./stop-dialog.styles";
import type { StopDialogProps, StopManualPathOption } from "./stop-dialog.types";
import type { StopDialogModel } from "./use-stop-dialog-model";
import {
  stopDetailLabels,
  stopDialogDetailTypeOptions,
} from "./stop-dialog.utils";

interface StopDialogFormFieldsProps {
  dayOptions: string[];
  detailLabels: ReturnType<typeof stopDetailLabels>;
  locale: Locale;
  manualPathOptions: StopManualPathOption[];
  mode: StopDialogProps["mode"];
  model: StopDialogModel;
  moreDetailsLabel: string;
  placeResolution: StopDialogProps["placeResolution"];
  startDate?: string;
  stopDialogMessages: Messages["stopDialog"];
  itineraryHeaders: Messages["itinerary"]["headers"];
}

export function StopDialogFormFields({
  dayOptions,
  detailLabels,
  itineraryHeaders,
  locale,
  manualPathOptions,
  mode,
  model,
  moreDetailsLabel,
  placeResolution,
  startDate,
  stopDialogMessages,
}: StopDialogFormFieldsProps) {
  const {
    derivedDuration,
    detailType,
    detailValues,
    isSubActivity,
    selectedCandidate,
    setSelectedCandidate,
    submitError,
    toggleNextDayEnd,
    update,
    updateActivity,
    updateDetail,
    updateDetailType,
    updateEndTime,
    updateStartTime,
    updateTimeMode,
    values,
  } = model;
  const isFocusedEdit = mode === "edit";

  return (
    <div className={dialogGridClassName}>
      <StopDialogContextFields
        dayLabel={stopDialogMessages.fields.day}
        dayOptions={dayOptions}
        detailLabels={detailLabels}
        detailType={detailType}
        detailTypeOptions={stopDialogDetailTypeOptions}
        isSubActivity={isSubActivity}
        locale={locale}
        manualPathOptions={manualPathOptions}
        mode={mode}
        pathLabel={stopDialogMessages.fields.plan}
        startDate={startDate}
        typeLabel={stopDialogMessages.fields.type}
        values={values}
        onUpdate={update}
        onUpdateDetailType={updateDetailType}
      />
      {mode === "create" ? (
        <StopDialogAdvancedFields
          advancedLabel={detailLabels.fields.advanced}
          isSubActivity={isSubActivity}
          values={values}
          onUpdate={update}
          onUpdateTimeMode={updateTimeMode}
        />
      ) : null}
      <StopDialogTimeWindow
        activity={values.activity}
        derivedDuration={derivedDuration}
        durationLabel={itineraryHeaders.duration}
        endLabel={stopDialogMessages.fields.endTime}
        endOffsetDays={values.endOffsetDays}
        endTime={values.endTime}
        locale={locale}
        nextDayLabel={locale === "th" ? "ข้ามวัน" : "Next day"}
        notSetLabel={locale === "th" ? "ไม่ระบุ" : "Not set"}
        startLabel={stopDialogMessages.fields.startTime}
        startTime={values.startTime}
        timeMode={values.timeMode}
        onEndTimeChange={updateEndTime}
        onStartTimeChange={updateStartTime}
        onToggleNextDayEnd={toggleNextDayEnd}
      />
      <StopDialogPrimaryFields
        activityLabel={stopDialogMessages.fields.activity}
        detailType={detailType}
        isFocusedEdit={isFocusedEdit}
        noteLabel={stopDialogMessages.fields.note}
        placeLabel={stopDialogMessages.fields.place}
        transportationLabel={stopDialogMessages.fields.transportation}
        values={values}
        onUpdate={update}
        onUpdateActivity={updateActivity}
      />
      <StopDialogDetailSection
        detailLabels={detailLabels}
        detailType={detailType}
        detailValues={detailValues}
        isFocusedEdit={isFocusedEdit}
        mapLink={values.mapLink}
        mapLinkLabel={stopDialogMessages.fields.mapLink}
        moreDetailsLabel={moreDetailsLabel}
        onMapLinkChange={(mapLink) => update("mapLink", mapLink)}
        updateDetail={updateDetail}
      />
      {placeResolution ? (
        <StopDialogPlaceResolution
          candidates={placeResolution.candidates}
          candidateListLabel={stopDialogMessages.placeResolution.candidates}
          chooseCandidateLabel={(name) => stopDialogMessages.actions.chooseCandidate({ name })}
          selectedCandidate={selectedCandidate}
          state={placeResolution.state}
          unresolvedMessage={stopDialogMessages.placeResolution.unresolved}
          onSelectCandidate={setSelectedCandidate}
        />
      ) : null}
      {submitError ? (
        <p className={dialogErrorClassName} role="alert">
          {submitError}
        </p>
      ) : null}
    </div>
  );
}
