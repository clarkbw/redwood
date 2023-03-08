import React, { useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import LoadingSpinner from '../Components/LoadingSpinner'
import TraceFlameView from '../Components/TraceFlameView'
import TraceTimelineView from '../Components/TraceTimelineView'

const GET_TRACE_SPANS = gql`
  query GetTraceSpans($id: String!) {
    trace(id: $id) {
      id
      spans {
        id
        name
        parent
        kind
        statusCode
        statusMessage
        startNano
        endNano
        durationNano
        events
        attributes
        resources
      }
    }
  }
`

function Trace() {
  const { traceId } = useParams()
  const { loading, error, data } = useQuery(GET_TRACE_SPANS, {
    variables: { id: traceId },
  })

  const [visualisationMode, setVisualisationMode] = useState<
    'timeline' | 'flame'
  >(() => {
    return 'timeline'
  })

  if (error) {
    return <div>{JSON.stringify(error)}</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (data.trace.spans.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-2">
        <div className="text-4xl">😔</div>
        <div className="text-xl">
          No spans found for trace: <span className="italic">{traceId}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-h-full">
      <div className="flex flex-col gap-0">
        <span>Trace ID: {traceId}</span>
        <div className="flex flex-row border border-gray-400 gap-0">
          <div className="p-2 italic">
            TODO: Some trace info (e.g. duration, status, etc.)
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0">
        <span>View</span>
        <select
          name="visualisationModeSelector"
          className="w-full p-2 border border-gray-400 bg-transparent"
          onChange={(e) => {
            setVisualisationMode(e.target.value as 'timeline' | 'flame')
          }}
        >
          <option value="timeline" selected={visualisationMode === 'timeline'}>
            ⏱️ Timeline
          </option>
          <option value="flame" selected={visualisationMode === 'flame'}>
            🔥 Flame Table
          </option>
        </select>
      </div>
      <div className="flex flex-col border border-gray-400 p-2 grow">
        {visualisationMode === 'timeline' && (
          <TraceTimelineView trace={data?.trace} />
        )}
        {visualisationMode === 'flame' && (
          <TraceFlameView trace={data?.trace} />
        )}
      </div>
    </div>
  )
}

export default Trace
