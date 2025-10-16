FROM gcloud-docker-release.repo.gcloud.belgium.be/base-apache:3.18
COPY dist/wc-prescription-create/build /opt/src/web-components/prescription-create
COPY dist/wc-prescription-details/build /opt/src/web-components/prescription-details
COPY dist/wc-prescription-list/build /opt/src/web-components/prescription-list
COPY index.html /opt/src/web-components
USER 1001
CMD ["run"]
