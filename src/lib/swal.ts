// SweetAlert2 helper — ensures `swal.fire(...)` works everywhere
import Swal from "sweetalert2";

export const swal = Swal.mixin({
  background: "#0b1220",
  color: "#e5e7eb",
  confirmButtonColor: "#3b82f6",
  cancelButtonColor: "#64748b",
  buttonsStyling: true,
});
