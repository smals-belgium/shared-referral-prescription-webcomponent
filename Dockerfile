FROM gcloud-docker-release.repo.gcloud.belgium.be/base-apache:3.18
COPY dist/wc-create-prescription/build /opt/src/web-components/create-prescription
COPY dist/wc-prescription-details/build /opt/src/web-components/prescription-details
COPY dist/wc-prescription-list/build /opt/src/web-components/prescription-list
COPY index.html /opt/src/web-components
USER 1001
CMD ["run"]
