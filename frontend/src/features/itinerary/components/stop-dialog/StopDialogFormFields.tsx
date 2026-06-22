import { StopDialogAdvancedFields } from "./StopDialogAdvancedFields";
import { StopDialogContextFields } from "./StopDialogContextFields";
import { StopDialogDetailSection } from "./StopDialogDetailSection";
import { StopDialogPlaceResolution } from "./StopDialogPlaceResolution";
import { StopDialogPrimaryFields } from "./StopDialogPrimaryFields";
import { StopDialogTimeWindow } from "./StopDialogTimeWindow";
import { dialogErrorClassName, dialogGridClassName } from "./stop-dialog.styles";
import type { StopDialogFormFieldsProps } from "./stop-dialog.types";
import { stopDialogDetailTypeOptions } from "@/src/features/itinerary/domain/stop-details";

export function StopDialogFormFields({
  dayOptions,
  detailLabels,
  itineraryHeaders,
  locale,
  manualPathOptions,
  mode,
  model,
  placeResolution,
  startDate,
  stopDialogCopy,
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
        startLabel={stopDialogMessages.fields.startTime}
        startTime={values.startTime}
        timeMode={values.timeMode}
        timeWindowCopy={stopDialogCopy.timeWindow}
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
        moreDetailsLabel={stopDialogCopy.moreDetailsLabel}
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
