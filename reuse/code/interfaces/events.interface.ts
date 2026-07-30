import { AssignCareGiverResource } from '@reuse/code/openapi';

/**
 * The standard payload emitted by the Web Component.
 * This structure is found inside the `event.detail` property of the custom event.
 */
export type WcDetailsEvent = FetchDataEvent;

interface FetchDataEvent {
  /** Triggered when the Web Component requires a list of professionals. */
  type: 'FETCH_PROFESSIONAL_DATA';
  /**
   * Contains the promise callbacks. The host MUST call either resolve or reject,
   * otherwise the internal request will keep waiting.
   */
  payload: {
    /** Call this with an array of AssignCareGiverResource objects to fulfill the request. */
    resolve: (data: AssignCareGiverResource[]) => void;
    /**
     * Call this with an reason if the data cannot be fetched.
     * This will cancel the loading state.
     */
    reject: (reason?: unknown) => void;
  };
}
