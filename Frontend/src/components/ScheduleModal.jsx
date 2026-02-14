import { useState } from "react";
import DatePicker from "react-datepicker";
import { X, Clock } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

const ScheduleModal = ({ isOpen, onClose, onSchedule, isLoading }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const handleSchedule = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    // Combine date and time in UTC
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0,
    );

    // Verify it's in the future
    if (scheduledDateTime <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    onSchedule(scheduledDateTime);
    resetForm();
  };

  const resetForm = () => {
    setSelectedDate(null);
    setSelectedTime(new Date());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="modal modal-open">
        <div className="modal-box w-96 bg-slate-800 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-cyan-400" />
              <h3 className="font-bold text-lg">Schedule Message</h3>
            </div>
            <button
              onClick={resetForm}
              className="btn btn-circle btn-ghost btn-sm"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Select Date</span>
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="input input-bordered input-sm w-full bg-slate-700 text-white border-slate-600"
                placeholderText="Click to select date"
              />
            </div>

            {/* Time Picker */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Select Time (UTC)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={selectedTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":");
                    const newTime = new Date(selectedTime);
                    newTime.setHours(parseInt(hours), parseInt(minutes));
                    setSelectedTime(newTime);
                  }}
                  className="input input-bordered input-sm w-full bg-slate-700 text-white border-slate-600"
                />
              </div>
              <label className="label">
                <span className="label-text-alt text-gray-400">
                  Timezone: UTC
                </span>
              </label>
            </div>

            {/* Preview */}
            {selectedDate && (
              <div className="alert alert-info bg-slate-700 border border-slate-600 text-sm text-white">
                <span>
                  Scheduled for:{" "}
                  <strong>
                    {selectedDate.toLocaleDateString()} at{" "}
                    {selectedTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    UTC
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="modal-action">
            <button
              onClick={resetForm}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              className="btn btn-primary btn-sm"
              disabled={!selectedDate || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Scheduling...
                </>
              ) : (
                "Schedule"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .react-datepicker {
          background-color: #334155;
          border-color: #475569;
        }
        .react-datepicker__header {
          background-color: #1e293b;
          border-color: #475569;
        }
        .react-datepicker__day-name,
        .react-datepicker__day {
          color: #e2e8f0;
        }
        .react-datepicker__day:hover {
          background-color: #06b6d4;
        }
        .react-datepicker__day--selected {
          background-color: #06b6d4;
        }
        .react-datepicker__day--outside-month {
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default ScheduleModal;
