FROM gcloud-docker-release.repo.gcloud.belgium.be/base-nginx-ose-mdw:2.6.0

LABEL UHMEP_HEALIX_WEB_COMPONENTS_VERSION=${VERSION} \
     UHMEP_HEALIX_WEB_COMPONENTS_BUILD_NUMBER=${BUILD_NUMBER} \
     MAINTAINER=uhmep@smals.be \
     VCS_URI="https://git.vascloud.be/nihdi/uhmep/healix/web-components"

COPY dist/wc-prescription-create/build ./web-components/prescription-create
COPY dist/wc-prescription-details/build ./web-components/prescription-details
COPY dist/wc-prescription-list/build ./web-components/prescription-list
COPY index.html ./web-components

# Copying the public showcases
COPY showcase ./showcases

# Copying the internal-only "form" showcase (kept outside the published showcase/ folder)
COPY contrib/showcase/form ./showcases/form

USER root

# Patch the internal "form" showcases so every asset they load resolves under the
# OpenShift route prefix /frontend/app/hcp/showcases (test / int / acc). Each page
# is exposed at /frontend/app/hcp/showcases/form/{create,details,list}.
RUN sed -i \
     -e 's|@smals-belgium-shared/uhmep-prescription-create/build/uhmep-prescription-create\.js|/frontend/app/hcp/showcases/prescription-create/wc-prescription-create.js|g' \
     -e 's|<base href="[^"]*"[^>]*>|<base href="/frontend/app/hcp/showcases/form/create/" />|g' \
     -e 's|\.\./showcases/lib/keycloak\.js|/frontend/app/hcp/showcases/lib/keycloak.js|g' \
     -e 's|\.\./showcases/form/showcase-utils\.js|/frontend/app/hcp/showcases/form/showcase-utils.js|g' \
     -e 's|/frontend/app/showcases/form/style/global\.css|/frontend/app/hcp/showcases/form/style/global.css|g' \
     /opt/app-root/src/showcases/form/create/index.html \
     && sed -i \
     -e 's|@smals-belgium-shared/uhmep-prescription-details/build/uhmep-prescription-details\.js|/frontend/app/hcp/showcases/prescription-details/wc-prescription-details.js|g' \
     -e 's|<base href="[^"]*"[^>]*>|<base href="/frontend/app/hcp/showcases/form/details/" />|g' \
     -e 's|\.\./showcases/lib/keycloak\.js|/frontend/app/hcp/showcases/lib/keycloak.js|g' \
     -e 's|\.\./showcases/form/showcase-utils\.js|/frontend/app/hcp/showcases/form/showcase-utils.js|g' \
     -e 's|/frontend/app/showcases/form/style/global\.css|/frontend/app/hcp/showcases/form/style/global.css|g' \
     -e 's|/frontend/app/showcases/form/style/dialog\.css|/frontend/app/hcp/showcases/form/style/dialog.css|g' \
     /opt/app-root/src/showcases/form/details/index.html \
     && sed -i \
     -e 's|@smals-belgium-shared/uhmep-prescription-list/build/uhmep-prescription-list\.js|/frontend/app/hcp/showcases/prescription-list/wc-prescription-list.js|g' \
     -e 's|<base href="[^"]*"[^>]*>|<base href="/frontend/app/hcp/showcases/form/list/" />|g' \
     -e 's|\.\./showcases/lib/keycloak\.js|/frontend/app/hcp/showcases/lib/keycloak.js|g' \
     -e 's|\.\./showcases/form/showcase-utils\.js|/frontend/app/hcp/showcases/form/showcase-utils.js|g' \
     -e 's|/frontend/app/showcases/form/style/global\.css|/frontend/app/hcp/showcases/form/style/global.css|g' \
     /opt/app-root/src/showcases/form/list/index.html

USER 1001

COPY contrib/etc/nginx/nginx.default.d/*.conf "${NGINX_DEFAULT_CONF_PATH}"
COPY contrib/etc/nginx/nginx.d/*.conf "${NGINX_CONFIGURATION_PATH}"
