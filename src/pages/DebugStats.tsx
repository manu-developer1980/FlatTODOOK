import React, { useEffect, useState } from "react";
import { db, supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/auth";
import { hasUserId } from "@/lib/userUtils";

export default function DebugStats() {
  const { user } = useAuthStore();
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [patient, setPatient] = useState<any | null>(null);
  const [testResult, setTestResult] = useState<{
    data: any;
    error: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDebugData = async () => {
      try {
        setLoading(true);

        console.log("Loading debug data for user:", user.id);

        // Get patient
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (patientError) {
          console.error("Error loading patient:", patientError);
        } else {
          console.log("Patient:", patientData);
          setPatient(patientData || null);
        }

        // Get medications
        const { data: medsData, error: medsError } = await db.getMedications(
          user.id
        );
        if (medsError) {
          console.error("Error loading medications:", medsError);
        } else {
          console.log("Medications:", medsData);
          setMedications(medsData || []);
        }

        // Get intake logs
        const { data: logsData, error: logsError } = await db.getIntakeLogs(
          user.id
        );
        if (logsError) {
          console.error("Error loading intake logs:", logsError);
        } else {
          console.log("Intake logs:", logsData);
          setIntakeLogs(logsData || []);
        }

        // Auto test intake log creation (uses first medication if available)
        if (!testResult && medsData && medsData.length > 0) {
          const med = medsData[0];
          console.log("Testing createIntakeLog with medication:", med.id);
          const testData = {
            taken_at: new Date().toISOString(),
            scheduled_time: new Date().toISOString(),
            status: "taken",
            notes: "DebugStats auto-test",
          };
          const { data: created, error: createError } =
            await db.createIntakeLog(med.id, testData);
          console.log("createIntakeLog test result:", { created, createError });
          setTestResult({ data: created, error: createError });
        }
      } catch (error) {
        console.error("Error loading debug data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDebugData();
  }, [user]);

  if (loading) {
    return <div className="p-4">Loading debug data...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug Statistics</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Patient</h2>
        <div className="p-3 bg-white rounded shadow">
          {patient ? (
            <div className="text-sm text-gray-600">
              <div className="font-medium">ID: {patient.id}</div>
              <div>User ID: {patient.user_id}</div>
              <div>
                Name: {patient.first_name} {patient.last_name}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No patient record found</div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Medications ({medications.length})
        </h2>
        <div className="space-y-2">
          {medications.map((med) => (
            <div key={med.id} className="p-3 bg-white rounded shadow">
              <div className="font-medium">{med.generic_name}</div>
              <div className="text-sm text-gray-600">ID: {med.id}</div>
              <div className="text-sm text-gray-600">
                Active: {med.is_active ? "Yes" : "No"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Intake Logs ({intakeLogs.length})
        </h2>
        <div className="space-y-2">
          {intakeLogs.map((log) => (
            <div key={log.id} className="p-3 bg-white rounded shadow">
              <div className="font-medium">
                Medication ID: {log.medication_id}
              </div>
              <div className="text-sm text-gray-600">
                Scheduled: {new Date(log.scheduled_time).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Taken:{" "}
                {log.taken_at
                  ? new Date(log.taken_at).toLocaleString()
                  : "Not taken"}
              </div>
              <div className="text-sm text-gray-600">Status: {log.status}</div>
              <div className="text-sm text-gray-600">
                Notes: {log.notes || "No notes"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Create Intake Log Test</h2>
        <div className="p-3 bg-white rounded shadow text-sm text-gray-600">
          {testResult ? (
            testResult.error ? (
              <>
                <div className="text-red-600 font-medium">Insert error</div>
                <pre className="mt-2 overflow-auto">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </>
            ) : (
              <>
                <div className="text-green-600 font-medium">Insert success</div>
                <pre className="mt-2 overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </>
            )
          ) : (
            <div>No test executed yet</div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Medication-Log Mapping</h2>
        <div className="space-y-2">
          {medications.map((med) => {
            const medLogs = intakeLogs.filter(
              (log) => log.medication_id === med.id
            );
            return (
              <div key={med.id} className="p-3 bg-white rounded shadow">
                <div className="font-medium">{med.generic_name}</div>
                <div className="text-sm text-gray-600">
                  Logs: {medLogs.length}
                </div>
                <div className="text-sm text-gray-600">
                  Taken: {medLogs.filter((log) => log.taken_at).length}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
