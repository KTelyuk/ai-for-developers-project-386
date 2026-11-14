import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

@service(#{ title: "Call Calendar API" })
@server("/", "Same origin")
namespace CallCalendar;

model HealthStatus {
  status: "ok";
}

@route("/api/health")
@tag("System")
interface Health {
  @get
  @operationId("getHealth")
  check(): HealthStatus;
}
