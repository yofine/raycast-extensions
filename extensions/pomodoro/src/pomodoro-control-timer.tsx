import { Detail, launchCommand, LaunchType, closeMainWindow, popToRoot, List, Icon } from "@raycast/api";
import { ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { exec } from "child_process";
import {
  continueInterval,
  createInterval,
  getCurrentInterval,
  getNextIntervalExecutor,
  isPaused,
  pauseInterval,
  preferences,
  resetInterval,
} from "../lib/intervals";
import { FocusText, ShortBreakText, LongBreakText } from "../lib/constants";
import { GiphyResponse } from "../lib/types";

const createAction = (action: () => void) => () => {
  action();

  try {
    launchCommand({
      name: "pomodoro-menu-bar",
      type: LaunchType.UserInitiated,
    });
  } catch (error) {
    console.error(error);
  }

  popToRoot();
  closeMainWindow();
};

const ActionsList = () => {
  const currentInterval = getCurrentInterval();

  return (
    <List navigationTitle="Control Pomodoro Timers">
      {currentInterval ? (
        <>
          {isPaused(currentInterval) ? (
            <List.Item
              title="Continue"
              icon={Icon.Play}
              actions={
                <ActionPanel>
                  <Action onAction={createAction(continueInterval)} title={"Continue"} />
                </ActionPanel>
              }
            />
          ) : (
            <List.Item
              title="Pause"
              icon={Icon.Pause}
              actions={
                <ActionPanel>
                  <Action onAction={createAction(pauseInterval)} title={"Pause"} />
                </ActionPanel>
              }
            />
          )}
          <List.Item
            title="Reset"
            icon={Icon.Stop}
            actions={
              <ActionPanel>
                <Action onAction={createAction(resetInterval)} title={"Reset"} />
              </ActionPanel>
            }
          />
        </>
      ) : (
        <>
          <List.Item
            title={`Focus`}
            subtitle={`${preferences.focusIntervalDuration}:00`}
            icon={`🎯`}
            actions={
              <ActionPanel>
                <Action onAction={createAction(() => createInterval("focus"))} title={"Focus"} />
              </ActionPanel>
            }
          />
          <List.Item
            title={`Short Break`}
            subtitle={`${preferences.shortBreakIntervalDuration}:00`}
            icon={`🧘‍♂️`}
            actions={
              <ActionPanel>
                <Action onAction={createAction(() => createInterval("short-break"))} title={"Short Break"} />
              </ActionPanel>
            }
          />
          <List.Item
            title={`Long Break`}
            subtitle={`${preferences.longBreakIntervalDuration}:00`}
            icon={`🚶`}
            actions={
              <ActionPanel>
                <Action onAction={createAction(() => createInterval("long-break"))} title={"Long Break"} />
              </ActionPanel>
            }
          />
        </>
      )}
    </List>
  );
};

const EndOfInterval = () => {
  let markdownImage;
  let usingGiphy = false;

  if (preferences.sound) {
    exec(`afplay /System/Library/Sounds/${preferences.sound}.aiff -v 10 && $$`);
  }

  if (preferences.giphyAPIKey) {
    const { isLoading, data } = useFetch(
      `https://api.giphy.com/v1/gifs/random?api_key=${preferences.giphyAPIKey}&tag=${preferences.giphyTag}&rating=${preferences.giphyRating}`,
      {
        keepPreviousData: true,
      }
    );
    if (!isLoading && data) {
      const giphyResponse = data as GiphyResponse;
      markdownImage = `![${giphyResponse.data.title}](${giphyResponse.data.images.fixed_height.url})`;
      usingGiphy = true;
    } else if (isLoading) {
      ("You did it!");
    } else {
      markdownImage = `![${"You did it!"}](${preferences.completionImage})`;
    }
  } else {
    markdownImage = `![${"You did it!"}](${preferences.completionImage})`;
  }

  const executor = getNextIntervalExecutor();

  return (
    <Detail
      navigationTitle={`Interval completed`}
      markdown={`${usingGiphy ? `![powered by GIPHY](Poweredby_100px-White_VertLogo.png) \n \n` : ""}` + markdownImage}
      actions={
        <ActionPanel title="Start Next Interval">
          <Action
            title={executor.title}
            onAction={createAction(executor.onStart)}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
          <Action
            title={FocusText}
            onAction={createAction(() => createInterval("focus"))}
            shortcut={{ modifiers: ["cmd"], key: "f" }}
          />
          <Action
            title={ShortBreakText}
            onAction={createAction(() => createInterval("short-break"))}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
          <Action
            title={LongBreakText}
            onAction={createAction(() => createInterval("long-break"))}
            shortcut={{ modifiers: ["cmd"], key: "l" }}
          />
        </ActionPanel>
      }
    />
  );
};

export default function Command(props: { launchContext?: { currentInterval: string } }) {
  return props.launchContext?.currentInterval ? <EndOfInterval /> : <ActionsList />;
}
