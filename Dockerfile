FROM gcloud-docker-release.repo.gcloud.belgium.be/base-apache:3.18

COPY dist/wc-prescription-create/build /opt/src/web-components/prescription-create
COPY dist/wc-prescription-details/build /opt/src/web-components/prescription-details
COPY dist/wc-prescription-list/build /opt/src/web-components/prescription-list
COPY index.html /opt/src/web-components

# Copying the public showcases
COPY showcase /opt/src/showcases

# Copying the internal-only "form" showcase (kept outside the published showcase/ folder)
COPY contrib/showcase/form /opt/src/showcases/form

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
      /opt/src/showcases/form/create/index.html \
 && sed -i \
      -e 's|@smals-belgium-shared/uhmep-prescription-details/build/uhmep-prescription-details\.js|/frontend/app/hcp/showcases/prescription-details/wc-prescription-details.js|g' \
      -e 's|<base href="[^"]*"[^>]*>|<base href="/frontend/app/hcp/showcases/form/details/" />|g' \
      -e 's|\.\./showcases/lib/keycloak\.js|/frontend/app/hcp/showcases/lib/keycloak.js|g' \
      -e 's|\.\./showcases/form/showcase-utils\.js|/frontend/app/hcp/showcases/form/showcase-utils.js|g' \
      -e 's|/frontend/app/showcases/form/style/global\.css|/frontend/app/hcp/showcases/form/style/global.css|g' \
      -e 's|/frontend/app/showcases/form/style/dialog\.css|/frontend/app/hcp/showcases/form/style/dialog.css|g' \
      /opt/src/showcases/form/details/index.html \
 && sed -i \
      -e 's|@smals-belgium-shared/uhmep-prescription-list/build/uhmep-prescription-list\.js|/frontend/app/hcp/showcases/prescription-list/wc-prescription-list.js|g' \
      -e 's|<base href="[^"]*"[^>]*>|<base href="/frontend/app/hcp/showcases/form/list/" />|g' \
      -e 's|\.\./showcases/lib/keycloak\.js|/frontend/app/hcp/showcases/lib/keycloak.js|g' \
      -e 's|\.\./showcases/form/showcase-utils\.js|/frontend/app/hcp/showcases/form/showcase-utils.js|g' \
      -e 's|/frontend/app/showcases/form/style/global\.css|/frontend/app/hcp/showcases/form/style/global.css|g' \
      /opt/src/showcases/form/list/index.html

USER 1001
CMD ["run"]
